import Link from "next/link";

import { MerchantPageHeader } from "@/components/merchant-page-header";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { merchantOwnerLoadErrorMessage } from "@/lib/merchant/merchant-owner-copy";
import { canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantCategoriesPage({ params }: Props) {
  const { tenant } = await params;
  const { role } = await requireMerchantForTenant(tenant);
  const canManageMenus = canManageMerchantMenus(role);

  const list = await listMenusForMerchant(tenant);

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
    <>
      <MerchantPageHeader
        tenant={tenant}
        title="카테고리"
        description="메뉴에 적힌 카테고리별 개수입니다. 이름은 메뉴 관리에서 각 메뉴를 수정하면 바뀝니다."
      />

      {!list.ok ? (
        <p
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {merchantOwnerLoadErrorMessage("menus", list.message)}
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
    </>
  );
}
