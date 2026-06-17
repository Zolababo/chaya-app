import { MerchantCalloutLink } from "@/components/merchant-callout-link";

type Props = {
  tenant: string;
  pendingCount: number;
  delayedCount: number;
};

/**
 * 홈 최상단 긴급 알림 — 신규·지연 주문 시 주문 탭으로 이동.
 */
export function MerchantHomeUrgentBanner({ tenant, pendingCount, delayedCount }: Props) {
  const t = encodeURIComponent(tenant);
  const hasPending = pendingCount > 0;
  const hasDelayed = delayedCount > 0;

  if (!hasPending && !hasDelayed) return null;

  const parts: string[] = [];
  if (hasPending) parts.push(`신규 주문 ${pendingCount}건`);
  if (hasDelayed) parts.push(`지연 ${delayedCount}건`);
  const title = parts.join(" · ");

  const href = hasDelayed
    ? `/m/${t}/orders?tab=cooking`
    : `/m/${t}/orders?tab=pending`;

  return (
    <MerchantCalloutLink
      href={href}
      tone="urgent"
      title={title}
      description="지금 바로 확인이 필요해요"
      actionLabel="주문 탭"
      ariaLabel={`${title} — 주문 탭으로 이동`}
    />
  );
}
