import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { MerchantMenuEditForm } from "@/components/merchant-menu-edit-form";
import { MerchantActionToast } from "@/components/merchant-action-toast";
import { MerchantMenuTranslationNotice } from "@/components/merchant-menu-translation-notice";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import {
  merchantMenusActionErrorMessage,
  merchantMenusActionSuccessMessage,
} from "@/lib/merchant/merchant-owner-copy";
import { parseMerchantMenuEditTab } from "@/lib/merchant/merchant-menu-edit-tab";
import {
  menuTranslationNotice,
  type MenuTranslationSource,
} from "@/lib/merchant/merchant-menu-translation-source";
import { canDeleteMerchantMenu, canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import { getMenuForMerchant, listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string; menuId: string }>;
  searchParams: Promise<{
    e?: string;
    ok?: string;
    warn?: string;
    hint?: string;
    category?: string;
    tab?: string;
  }>;
};

function noticeFromOk(ok: string | undefined): MenuTranslationSource | null {
  if (ok === "saved_hansik" || ok === "saved_translated") return "hansik";
  if (ok === "saved_ai_new" || ok === "saved_ai_translated") return "gemini_new";
  if (ok === "saved_ai_cache") return "gemini_cache";
  return null;
}

export default async function MerchantMenuEditPage({ params, searchParams }: Props) {
  const { tenant, menuId } = await params;
  const sp = await searchParams;

  const { role } = await requireMerchantForTenant(tenant);
  if (!canManageMerchantMenus(role)) {
    redirect(`/m/${encodeURIComponent(tenant)}/dashboard?e=no_menus_access`);
  }

  const canDeleteMenus = canDeleteMerchantMenu(role);
  const categoryFilter =
    typeof sp.category === "string" && sp.category.trim() ? sp.category.trim() : null;
  const activeTab = parseMerchantMenuEditTab(typeof sp.tab === "string" ? sp.tab : undefined);
  const tEnc = encodeURIComponent(tenant);

  const [menu, allMenus] = await Promise.all([
    getMenuForMerchant(tenant, menuId),
    listMenusForMerchant(tenant),
  ]);

  if (!menu.ok) {
    redirect(`/m/${tEnc}/menus?e=not_found`);
  }

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

  const okMsg = merchantMenusActionSuccessMessage(sp.ok, sp.warn);
  const errMsg = merchantMenusActionErrorMessage(sp.e, sp.hint);
  const justSavedSource = noticeFromOk(sp.ok);
  const storedSource = menu.item.translationSource;
  const translationNoticeSource = justSavedSource ?? storedSource;
  const translationNotice = translationNoticeSource
    ? menuTranslationNotice(translationNoticeSource)
    : null;

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
          <h1 className="text-[18px] font-extrabold text-zinc-900 dark:text-zinc-50">{menu.item.name}</h1>
          <p className="text-[11px] text-zinc-400">이름·가격·카테고리만 수정해도 바로 반영돼요</p>
        </div>
      </div>

      {okMsg ? <MerchantActionToast message={okMsg} kind="ok" /> : null}
      {errMsg ? <MerchantActionToast message={errMsg} kind="error" /> : null}
      {translationNotice ? (
        <MerchantMenuTranslationNotice notice={translationNotice} prominent={Boolean(justSavedSource)} />
      ) : null}

      <MerchantMenuEditForm
        tenant={tenant}
        item={menu.item}
        categoryFilter={categoryFilter}
        canDeleteMenus={canDeleteMenus}
        activeTab={activeTab}
        existingCategories={existingCategories}
      />
    </>
  );
}
