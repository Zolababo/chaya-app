import Link from "next/link";
import { redirect } from "next/navigation";

import { MenuTranslationFields } from "@/components/menu-translation-fields";
import { MerchantMenuCatalog } from "@/components/merchant-menu-catalog";
import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { canDeleteMerchantMenu, canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import { MERCHANT_OPTIONS_INPUT_PLACEHOLDER } from "@/lib/menus/menu-options";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";
import { countMerchantPendingOrders } from "@/lib/orders/list-orders-for-merchant";

import { createMenuFromForm } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ e?: string; ok?: string; warn?: string; hint?: string; category?: string }>;
};

function errorMessage(code: string | undefined, hint?: string | null): string | null {
  if (!code) return null;
  switch (code) {
    case "bad_input":
      return hint?.trim() || "이름·가격 등 입력값을 확인해 주세요.";
    case "no_service":
      return "서버에 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.";
    case "db":
      return "저장에 실패했습니다. DB 제약·RLS·필수 컬럼을 확인해 주세요.";
    case "owner_only_delete":
      return "메뉴 삭제는 소장(owner)만 할 수 있습니다. 메뉴 담당(menu_editor)은 추가·수정·품절만 가능합니다.";
    case "bad_options":
      return hint?.trim() || "옵션 입력 형식을 확인해 주세요.";
    case "upload":
      return hint?.trim() || "이미지 업로드에 실패했습니다. Supabase Storage 버킷 menu-images 가 있는지 확인해 주세요.";
    default:
      return "처리 중 오류가 났습니다.";
  }
}

const categoryChipActive =
  "inline-flex min-h-[44px] shrink-0 items-center rounded-full bg-chaya-primary px-4 py-2 text-xs font-semibold text-chaya-on-primary shadow-sm sm:text-sm";
const categoryChipIdle =
  "inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-xs font-semibold text-zinc-600 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 sm:text-sm";

export default async function MerchantMenusPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { e, ok, warn, hint, category: categoryParam } = await searchParams;

  const { role } = await requireMerchantForTenant(tenant);
  if (!canManageMerchantMenus(role)) {
    redirect(`/m/${encodeURIComponent(tenant)}/dashboard?e=no_menus_access`);
  }
  const canDeleteMenus = canDeleteMerchantMenu(role);

  const [list, pendingCount] = await Promise.all([
    listMenusForMerchant(tenant),
    countMerchantPendingOrders(tenant),
  ]);
  const errMsg = errorMessage(e, hint);
  const savedOk = ok === "saved" || ok === "image_saved";
  const imageSavedOk = ok === "image_saved";
  const warnMsg = typeof warn === "string" && warn.trim() ? warn.trim() : null;
  const categoryFilter =
    typeof categoryParam === "string" && categoryParam.trim() ? categoryParam.trim() : null;
  const displayItems =
    list.ok && categoryFilter
      ? list.items.filter((it) => (it.category?.trim() || "기타") === categoryFilter)
      : list.ok
        ? list.items
        : [];

  const categoryTabs = list.ok
    ? Array.from(new Set(list.items.map((it) => (it.category?.trim() || "기타")))).sort((a, b) =>
        a.localeCompare(b, "ko"),
      )
    : [];

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="mb-2 border-b border-chaya-border pb-4 dark:border-zinc-700">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="text-2xl font-bold">메뉴 관리 — {tenant}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          손님 메뉴판:{" "}
          <Link className="font-medium text-chaya-primary underline-offset-2 hover:underline" href={`/t/${tenant}`}>
            /t/{tenant}
          </Link>
        </p>
      </header>

      <MerchantPreviewBanner tenantSlug={tenant} />

      <MerchantSubnav tenant={tenant} pendingOrderCount={pendingCount} canManageMenus />

      <div className="mb-6">
        <OrderStatusRefresh />
      </div>

      {savedOk ? (
        <p
          role="status"
          className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
        >
          {imageSavedOk ? "메뉴 사진을 저장했습니다." : "메뉴를 저장했습니다."}
          {warnMsg ? ` (${warnMsg})` : null}
        </p>
      ) : null}

      {errMsg ? (
        <p
          role="alert"
          aria-live="assertive"
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
        >
          {errMsg}
        </p>
      ) : null}

      {!list.ok ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
        >
          {list.message}
        </p>
      ) : (
        <>
          {categoryTabs.length > 0 ? (
            <nav
              className="mb-4 flex gap-1.5 overflow-x-auto pb-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              aria-label="카테고리 (손님 메뉴판과 동일)"
            >
              <Link
                href={`/m/${encodeURIComponent(tenant)}/menus`}
                className={categoryFilter == null ? categoryChipActive : categoryChipIdle}
              >
                전체
              </Link>
              {categoryTabs.map((c) => (
                <Link
                  key={c}
                  href={`/m/${encodeURIComponent(tenant)}/menus?category=${encodeURIComponent(c)}`}
                  className={categoryFilter === c ? categoryChipActive : categoryChipIdle}
                >
                  {c}
                </Link>
              ))}
            </nav>
          ) : null}

          <section className="mx-auto mb-8 max-w-lg">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950">
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                아래 목록은 손님 메뉴판과 같은 카테고리·순서·썸네일 형태입니다. 수정 후 손님 화면에서 확인하세요.
              </p>
              <Link
                href={`/t/${encodeURIComponent(tenant)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-xl bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary"
              >
                손님 메뉴판 열기
              </Link>
            </div>
            <h2 className="mb-3 text-lg font-semibold">
              등록된 메뉴 (
              {categoryFilter ? `${displayItems.length} / 전체 ${list.items.length}` : list.items.length})
            </h2>
            {list.items.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">아직 메뉴가 없습니다. 아래에서 추가해 주세요.</p>
            ) : categoryFilter && displayItems.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">
                이 카테고리에 해당하는 메뉴가 없습니다. 필터를 바꾸거나 메뉴의 카테고리를 수정해 주세요.
              </p>
            ) : (
              <MerchantMenuCatalog
                tenant={tenant}
                items={displayItems}
                categoryFilter={categoryFilter}
                canDeleteMenus={canDeleteMenus}
                listLabel={
                  categoryFilter ? `${categoryFilter} 카테고리 메뉴` : "전체 메뉴 (손님 화면 미리보기)"
                }
              />
            )}
          </section>

          <details className="mx-auto max-w-lg rounded-xl border border-chaya-border bg-chaya-surface dark:border-zinc-700 dark:bg-zinc-950">
            <summary className="cursor-pointer px-4 py-3 text-lg font-semibold">새 메뉴 추가</summary>
            <form
              action={createMenuFromForm}
              encType="multipart/form-data"
              className="grid gap-3 border-t border-chaya-border p-4 sm:grid-cols-2 dark:border-zinc-800"
            >
              <input type="hidden" name="tenant_slug" value={tenant} />
              {categoryFilter != null ? (
                <input type="hidden" name="preserve_category" value={categoryFilter} />
              ) : null}
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-name">
                  이름 *
                </label>
                <input
                  id="new-name"
                  name="name"
                  required
                  maxLength={200}
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-price">
                  가격(원) *
                </label>
                <input
                  id="new-price"
                  name="price"
                  type="text"
                  inputMode="numeric"
                  required
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-category">
                  카테고리
                </label>
                <input
                  id="new-category"
                  name="category"
                  maxLength={120}
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-sort">
                  표시 순서
                </label>
                <input
                  id="new-sort"
                  name="sort_order"
                  type="number"
                  min={0}
                  max={2000000}
                  inputMode="numeric"
                  placeholder="비우면 맨 뒤"
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
                <p className="mt-1 text-xs text-zinc-500">숫자가 작을수록 손님 화면에서 먼저 나옵니다.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-desc">
                  설명
                </label>
                <textarea
                  id="new-desc"
                  name="description"
                  rows={2}
                  maxLength={2000}
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  id="new-sold-out"
                  name="is_sold_out"
                  type="checkbox"
                  value="on"
                  className="h-4 w-4 rounded border-chaya-border"
                />
                <label htmlFor="new-sold-out" className="text-sm text-zinc-700 dark:text-zinc-300">
                  추가 직후 품절로 표시
                </label>
              </div>
              <div className="sm:col-span-2">
                <MenuTranslationFields translations={{}} idPrefix="new" />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-file">
                  이미지 파일
                </label>
                <input
                  id="new-file"
                  name="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/*"
                  className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-chaya-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-chaya-on-primary"
                />
                <p className="mt-1 text-xs text-zinc-500">최대 5MB. 선택 시 URL보다 우선합니다.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-options">
                  옵션 (선택)
                </label>
                <textarea
                  id="new-options"
                  name="options_json"
                  rows={3}
                  maxLength={12000}
                  placeholder={MERCHANT_OPTIONS_INPUT_PLACEHOLDER}
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-img">
                  이미지 URL (선택)
                </label>
                <input
                  id="new-img"
                  name="imageUrl"
                  type="text"
                  maxLength={2000}
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-chaya-primary px-4 py-2 font-semibold text-chaya-on-primary"
                >
                  추가
                </button>
              </div>
            </form>
          </details>
        </>
      )}
    </div>
  );
}
