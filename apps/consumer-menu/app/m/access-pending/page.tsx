import Link from "next/link";
import { redirect } from "next/navigation";

import {
  fetchMerchantMembership,
  merchantAccessPendingUrl,
  merchantLoginUrl,
} from "@/lib/merchant/merchant-access";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function MerchantAccessPendingPage({ searchParams }: Props) {
  const sp = await searchParams;
  let rawTenant = typeof sp.tenant === "string" ? sp.tenant.trim() : "";
  try {
    rawTenant = decodeURIComponent(rawTenant).trim();
  } catch {
    /* invalid % sequence — keep raw */
  }
  const slugNorm = rawTenant ? normalizeTenantSlug(rawTenant) : null;
  const tenantLabel = slugNorm ?? (rawTenant || null);

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="text-xl font-bold">설정 필요</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">Supabase 클라이언트를 만들 수 없습니다.</p>
      </div>
    );
  }

  const user = await resolveServerUser(supabase);
  if (!user) {
    const next = tenantLabel
      ? merchantAccessPendingUrl(tenantLabel)
      : "/m/access-pending";
    redirect(merchantLoginUrl(next));
  }

  if (tenantLabel) {
    const m = await fetchMerchantMembership(supabase, user.id, tenantLabel);
    if (m?.approvedAt != null) {
      redirect(`/m/${encodeURIComponent(tenantLabel)}/dashboard`);
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <h1 className="text-2xl font-bold">운영 승인 대기</h1>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
        계정은 만들어졌지만, 이 가게에 대한 <strong>운영자 승인</strong>이 아직 완료되지 않았습니다. 옆에서 계시는 담당자에게
        말씀해 주시면, 운영 화면에서 <span className="font-mono text-xs">승인</span> 버튼을 누른 뒤 이 페이지를 새로고침하면
        점주앱으로 들어갈 수 있습니다.
      </p>
      {tenantLabel ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          요청한 매장 주소: <span className="font-mono font-semibold">{tenantLabel}</span>
        </p>
      ) : (
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          주소 표시가 없습니다. <Link className="font-medium text-chaya-primary underline" href="/m">가게 선택</Link>으로
          돌아가 주세요.
        </p>
      )}
      <ul className="mt-6 list-inside list-disc space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
        <li>운영자: <span className="font-mono">/ops/merchants</span> 목록에서 해당 행의 「승인」을 누릅니다.</li>
        <li>승인 직후: 아래 버튼으로 다시 시도하거나, 대시보드 주소로 직접 이동해 보세요.</li>
      </ul>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href={tenantLabel ? `/m/${encodeURIComponent(tenantLabel)}/dashboard` : "/m"}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-5 py-3 text-sm font-semibold text-chaya-on-primary"
        >
          다시 들어가 보기
        </Link>
        <Link
          href="/m"
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-5 py-3 text-sm font-semibold dark:border-zinc-600"
        >
          가게 선택으로
        </Link>
      </div>
      <form action="/m/logout" method="post" className="mt-10 text-center">
        <button type="submit" className="text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400">
          다른 계정으로 로그아웃
        </button>
      </form>
    </div>
  );
}
