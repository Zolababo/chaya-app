import { PREF_TABLE_MAX } from "@/lib/cart/table-pref";
import { listMenusForTenant } from "@/lib/menus/queries";

import { CartCheckoutClient } from "./cart-checkout-client";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ table?: string | string[] }>;
};

export default async function CartPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const tableRaw = sp.table;
  const tableFromUrl =
    typeof tableRaw === "string" ? tableRaw.trim().slice(0, PREF_TABLE_MAX) : "";
  const menu = await listMenusForTenant(tenant);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">주문 확인</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          메뉴에서 담은 품목은 이 브라우저에만 저장됩니다. Supabase `orders` 로 주문을 보냅니다.
        </p>
      </div>

      {menu.notice ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
          {menu.notice}
        </p>
      ) : null}

      <CartCheckoutClient
        key={tenant}
        tenant={tenant}
        initialLines={[]}
        initialTableHint={tableFromUrl || null}
      />
    </div>
  );
}
