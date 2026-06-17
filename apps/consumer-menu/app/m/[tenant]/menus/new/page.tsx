import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { MerchantMenuAddForm } from "@/components/merchant-menu-add-form";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ category?: string }>;
};

export default async function MerchantMenuNewPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;

  const { role } = await requireMerchantForTenant(tenant);
  if (!canManageMerchantMenus(role)) {
    redirect(`/m/${encodeURIComponent(tenant)}/dashboard?e=no_menus_access`);
  }

  const tEnc = encodeURIComponent(tenant);
  const categoryFilter =
    typeof sp.category === "string" && sp.category.trim() ? sp.category.trim() : null;

  const allMenus = await listMenusForMerchant(tenant);

  const menuItems = allMenus.ok ? allMenus.items : [];
  const existingCategories = Array.from(
    new Set(
      menuItems
        .map((m) => m.category)
        .filter((c): c is string => typeof c === "string" && c.trim().length > 0),
    ),
  );

  const listHref = categoryFilter
    ? `/m/${tEnc}/menus?category=${encodeURIComponent(categoryFilter)}`
    : `/m/${tEnc}/menus`;

  return (
    <>
      <div className="merchant-menus-edit-back mb-4 flex items-center gap-3">
        <Link
          href={listHref}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800"
          aria-label="메뉴 목록으로"
        >
          <ArrowLeft className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
        </Link>
        <div>
          <h1 className="text-[18px] font-extrabold text-zinc-900 dark:text-zinc-50">메뉴 추가</h1>
          <p className="text-[11px] text-zinc-400">이름·가격·카테고리만 입력해도 바로 등록돼요</p>
        </div>
      </div>

      <MerchantMenuAddForm
        tenant={tenant}
        categoryFilter={categoryFilter}
        existingCategories={existingCategories}
      />
    </>
  );
}
