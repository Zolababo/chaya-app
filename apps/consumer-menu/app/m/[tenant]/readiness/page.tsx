import Link from "next/link";

import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { resolveMerchantToken } from "@/lib/merchant/resolve-merchant-token";
import { countMerchantPendingOrders } from "@/lib/orders/list-orders-for-merchant";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function MerchantReadinessPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { token } = await searchParams;

  if (!(await resolveMerchantToken(token))) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <h1 className="text-xl font-bold">접근할 수 없습니다</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-mono">MERCHANT_ORDERS_TOKEN</span> 과 같은 값을{" "}
          <span className="font-mono">?token=</span> 으로 한 번 열면 쿠키에 저장됩니다.
        </p>
      </div>
    );
  }

  const pendingCount = await countMerchantPendingOrders(tenant);

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-8">
      <header className="mb-2 border-b border-chaya-border pb-4 dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="text-2xl font-bold">운영 체크 — {tenant}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          점주 전환·인증 제출 전 마지막 점검 항목을 한 곳에서 관리합니다.
        </p>
      </header>

      <MerchantPreviewBanner tenantSlug={tenant} />
      <MerchantSubnav tenant={tenant} pendingOrderCount={pendingCount} />

      <section className="rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">즉시 실행 체크</h2>
        <ul className="mt-3 space-y-2 text-sm text-zinc-700 dark:text-zinc-300">
          <li>- 점주 병행 검증표(`merchant-validation-demo-20260506.md`) 최근 3일 기록 확인</li>
          <li>- `stability:cycle` 결과에서 Consumer/Merchant/A11y 가 모두 PASS 인지 확인</li>
          <li>- `cert:pack --strict` 결과가 실패하지 않는지 확인</li>
          <li>- 점주 공지 템플릿(`MERCHANT_CUTOVER_NOTICE_TEMPLATE.md`) 최종 문안 확정</li>
        </ul>
      </section>

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href={`/m/${encodeURIComponent(tenant)}/orders`}
          className="rounded-xl border border-chaya-border bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          주문 큐로 이동
        </Link>
        <Link
          href={`/m/${encodeURIComponent(tenant)}/menus`}
          className="rounded-xl border border-chaya-border bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          메뉴 관리로 이동
        </Link>
      </section>
    </div>
  );
}
