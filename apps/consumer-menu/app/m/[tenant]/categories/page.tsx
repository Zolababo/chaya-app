import Link from "next/link";

import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";
import { countMerchantPendingOrders } from "@/lib/orders/list-orders-for-merchant";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantCategoriesPage({ params }: Props) {
  const { tenant } = await params;
  const { role } = await requireMerchantForTenant(tenant);
  const canManageMenus = role === "owner";

  const [pendingCount, list] = await Promise.all([
    countMerchantPendingOrders(tenant),
    listMenusForMerchant(tenant),
  ]);

  const tEnc = encodeURIComponent(tenant);

  const counts = new Map<string, number>();
  if (list.ok) {
    for (const it of list.items) {
      const key = it.category?.trim() || "기타";
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const rows = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0], "ko"));

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mb-6 border-b border-chaya-border pb-4 dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="mt-1 text-2xl font-bold">카테고리 — {tenant}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          메뉴에 적힌 카테고리별로 개수를 보여 줍니다. 이름 변경은 메뉴 수정에서 각 메뉴마다 바꿀 수 있습니다.
        </p>
      </header>

      <MerchantPreviewBanner tenantSlug={tenant} />

      <MerchantSubnav tenant={tenant} pendingOrderCount={pendingCount} canManageMenus={canManageMenus} />

      <div className="mb-6">
        <OrderStatusRefresh />
      </div>

      {!list.ok ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {list.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">등록된 메뉴가 없습니다.</p>
      ) : (
        <ul className="divide-y divide-chaya-border overflow-hidden rounded-xl border border-chaya-border bg-chaya-surface dark:divide-zinc-800 dark:border-zinc-700 dark:bg-zinc-950">
          {rows.map(([label, n]) => (
            <li
              key={label}
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm sm:text-base"
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
              <div className="flex items-center gap-3">
                <span className="tabular-nums text-zinc-600 dark:text-zinc-400">{n}개 메뉴</span>
                {canManageMenus ? (
                  <Link
                    href={`/m/${tEnc}/menus?category=${encodeURIComponent(label)}`}
                    className="rounded-lg border border-chaya-border px-3 py-1.5 text-xs font-semibold text-chaya-primary dark:border-zinc-600 dark:text-orange-400"
                  >
                    메뉴 목록에서 보기
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {canManageMenus ? (
        <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="font-medium text-chaya-primary underline-offset-2 hover:underline" href={`/m/${tEnc}/menus`}>
            메뉴 관리
          </Link>
          에서 카테고리 문자열을 수정하면 이 화면도 함께 바뀝니다.
        </p>
      ) : null}
    </div>
  );
}
