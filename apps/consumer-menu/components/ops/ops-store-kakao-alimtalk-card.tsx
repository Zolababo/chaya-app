import { MessageCircle } from "lucide-react";

import { setTenantKakaoAlimtalkLinkedFromOps } from "@/app/ops/stores/[slug]/actions";
import { OpsBadge, OpsCard } from "@/components/ops/ops-ui";
import { isMerchantOrderNotifyWebhookConfigured } from "@/lib/notifications/merchant-order-notify-webhook";
import { isKakaoAlimtalkLinked, type TenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

type Props = {
  tenantSlug: string;
  settings: TenantStoreSettings;
};

function formatLinkedAt(iso: string | null): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return new Date(t).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function OpsStoreKakaoAlimtalkCard({ tenantSlug, settings }: Props) {
  const linked = isKakaoAlimtalkLinked(settings);
  const linkedAtLabel = formatLinkedAt(settings.kakaoAlimtalkLinkedAt);
  const webhookOn = isMerchantOrderNotifyWebhookConfigured();

  return (
    <OpsCard
      title="카카오 알림톡"
      subtitle="점주 더보기 · 알림 화면에 연동 상태가 반영됩니다"
      headerExtra={
        <OpsBadge tone={linked ? "green" : "orange"}>{linked ? "연동됨" : "미연동"}</OpsBadge>
      }
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[rgba(254,229,0,0.15)] text-[#3C1E1E]">
          <MessageCircle className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
          <p>
            Biz 채널·템플릿 승인 후 아래에서 <strong className="text-ops-text">연동 완료</strong>를 누르세요.
            실제 발송은 카카오 API 또는 웹훅 연동이 필요합니다.
          </p>
          {linkedAtLabel ? (
            <p className="mt-2 text-xs font-semibold text-zinc-500">
              연동 시각 (KST): {linkedAtLabel}
            </p>
          ) : null}
          <p className="mt-2 text-xs">
            주문 웹훅:{" "}
            <span className={webhookOn ? "font-bold text-[#22D3A0]" : "font-bold text-[#F7983A]"}>
              {webhookOn ? "환경 변수 설정됨" : "미설정"}
            </span>
            {!webhookOn ? (
              <span className="text-zinc-500"> · `MERCHANT_ORDER_NOTIFY_WEBHOOK_URL`</span>
            ) : null}
          </p>
        </div>
      </div>

      <form action={setTenantKakaoAlimtalkLinkedFromOps} className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="tenant_slug" value={tenantSlug} />
        {linked ? (
          <>
            <input type="hidden" name="intent" value="unlink" />
            <button
              type="submit"
              className="rounded-lg border border-ops-border-2 bg-ops-surface px-4 py-2 text-xs font-bold text-ops-subtle transition hover:opacity-90"
            >
              연동 해제
            </button>
          </>
        ) : (
          <>
            <input type="hidden" name="intent" value="link" />
            <button
              type="submit"
              className="rounded-lg bg-[#5B6BF8] px-4 py-2 text-xs font-extrabold text-white transition hover:opacity-90"
            >
              연동 완료 표시
            </button>
          </>
        )}
      </form>
    </OpsCard>
  );
}
