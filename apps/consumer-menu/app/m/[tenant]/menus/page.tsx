import Link from "next/link";
import { redirect } from "next/navigation";

import { MerchantConfirmSubmitButton } from "@/components/merchant-confirm-submit";
import { MerchantPreviewBanner } from "@/components/merchant-preview-banner";
import { MerchantSubnav } from "@/components/merchant-subnav";
import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { canManageMerchantMenus } from "@/lib/merchant/merchant-role-capabilities";
import { listMenusForMerchant } from "@/lib/menus/list-menus-for-merchant";
import { countMerchantPendingOrders } from "@/lib/orders/list-orders-for-merchant";

import { createMenuFromForm, deleteMenuFromForm, setMenuSoldOutFromForm, updateMenuFromForm } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ e?: string; category?: string }>;
};

function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "bad_input":
      return "이름·가격 등 입력값을 확인해 주세요.";
    case "no_service":
      return "서버에 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.";
    case "db":
      return "저장에 실패했습니다. DB 제약·RLS·필수 컬럼을 확인해 주세요.";
    case "upload":
      return "이미지 업로드에 실패했습니다. Storage 버킷(menu-images)·정책·파일 형식·용량을 확인해 주세요.";
    default:
      return "처리 중 오류가 났습니다.";
  }
}

export default async function MerchantMenusPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { e, category: categoryParam } = await searchParams;

  const { role } = await requireMerchantForTenant(tenant);
  if (!canManageMerchantMenus(role)) {
    redirect(`/m/${encodeURIComponent(tenant)}/dashboard?e=no_menus_access`);
  }

  const [list, pendingCount] = await Promise.all([
    listMenusForMerchant(tenant),
    countMerchantPendingOrders(tenant),
  ]);
  const errMsg = errorMessage(e);
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
              className="mb-6 flex flex-wrap gap-2"
              aria-label="카테고리로 메뉴 목록 필터"
            >
              <Link
                href={`/m/${encodeURIComponent(tenant)}/menus`}
                className={
                  categoryFilter == null
                    ? "inline-flex min-h-[40px] items-center rounded-full bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary"
                    : "inline-flex min-h-[40px] items-center rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                }
              >
                전체
              </Link>
              {categoryTabs.map((c) => {
                const active = categoryFilter === c;
                return (
                  <Link
                    key={c}
                    href={`/m/${encodeURIComponent(tenant)}/menus?category=${encodeURIComponent(c)}`}
                    className={
                      active
                        ? "inline-flex min-h-[40px] items-center rounded-full bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary"
                        : "inline-flex min-h-[40px] items-center rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-200"
                    }
                  >
                    {c}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          <section className="mb-10 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <h2 className="mb-3 text-lg font-semibold">새 메뉴 추가</h2>
            <form
              action={createMenuFromForm}
              encType="multipart/form-data"
              className="grid gap-3 sm:grid-cols-2"
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
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-file">
                  이미지 파일
                </label>
                <input
                  id="new-file"
                  name="file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-800"
                />
                <p className="mt-1 text-xs text-zinc-500">파일을 선택하면 아래 URL 보다 우선합니다. 최대 5MB.</p>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-img">
                  이미지 URL (선택)
                </label>
                <input
                  id="new-img"
                  name="imageUrl"
                  type="url"
                  maxLength={2000}
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl bg-chaya-primary px-4 py-2 font-semibold text-chaya-on-primary"
                >
                  추가
                </button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold">
              등록된 메뉴 (
              {categoryFilter ? `${displayItems.length} / 전체 ${list.items.length}` : list.items.length})
            </h2>
            {list.items.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">아직 메뉴가 없습니다. 위에서 추가해 주세요.</p>
            ) : categoryFilter && displayItems.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-400">
                이 카테고리에 해당하는 메뉴가 없습니다. 필터를 바꾸거나 메뉴의 카테고리를 수정해 주세요.
              </p>
            ) : (
              <ul className="space-y-4">
                {displayItems.map((item) => (
                  <li
                    key={item.id}
                    className="rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">
                          {item.name}
                          {item.isSoldOut ? (
                            <span className="ml-2 rounded-md bg-zinc-200 px-1.5 py-0.5 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100">
                              품절
                            </span>
                          ) : null}
                          <span className="ml-2 font-mono text-xs font-normal text-zinc-500">#{item.sortOrder}</span>
                        </p>
                        <p className="text-sm text-chaya-primary dark:text-orange-400">
                          {item.price.toLocaleString("ko-KR")}원
                          {item.category ? (
                            <span className="text-zinc-500 dark:text-zinc-400"> · {item.category}</span>
                          ) : null}
                        </p>
                        {item.description ? (
                          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.description}</p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <form action={setMenuSoldOutFromForm} className="inline">
                          <input type="hidden" name="tenant_slug" value={tenant} />
                          <input type="hidden" name="menu_id" value={item.id} />
                          <input type="hidden" name="is_sold_out" value="false" />
                          {categoryFilter != null ? (
                            <input type="hidden" name="preserve_category" value={categoryFilter} />
                          ) : null}
                          <button
                            type="submit"
                            disabled={!item.isSoldOut}
                            className="rounded-lg border border-chaya-border px-2 py-1 text-xs font-semibold text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-100"
                          >
                            판매
                          </button>
                        </form>
                        <form action={setMenuSoldOutFromForm} className="inline">
                          <input type="hidden" name="tenant_slug" value={tenant} />
                          <input type="hidden" name="menu_id" value={item.id} />
                          <input type="hidden" name="is_sold_out" value="true" />
                          {categoryFilter != null ? (
                            <input type="hidden" name="preserve_category" value={categoryFilter} />
                          ) : null}
                          <button
                            type="submit"
                            disabled={item.isSoldOut}
                            className="rounded-lg border border-amber-600/50 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-950 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                          >
                            품절
                          </button>
                        </form>
                      <form action={deleteMenuFromForm} className="shrink-0">
                        <input type="hidden" name="tenant_slug" value={tenant} />
                        <input type="hidden" name="menu_id" value={item.id} />
                        {categoryFilter != null ? (
                          <input type="hidden" name="preserve_category" value={categoryFilter} />
                        ) : null}
                        <MerchantConfirmSubmitButton
                          confirmMessage={`「${item.name}」메뉴를 삭제할까요?`}
                          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 dark:border-red-800 dark:text-red-300"
                        >
                          삭제
                        </MerchantConfirmSubmitButton>
                      </form>
                      </div>
                    </div>
                    <details className="mt-3 border-t border-chaya-border pt-3 dark:border-zinc-800">
                      <summary className="cursor-pointer text-sm font-medium text-chaya-primary">수정</summary>
                      <form
                        action={updateMenuFromForm}
                        encType="multipart/form-data"
                        className="mt-3 grid gap-3 sm:grid-cols-2"
                      >
                        <input type="hidden" name="tenant_slug" value={tenant} />
                        <input type="hidden" name="menu_id" value={item.id} />
                        {categoryFilter != null ? (
                          <input type="hidden" name="preserve_category" value={categoryFilter} />
                        ) : null}
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">이름 *</label>
                          <input
                            name="name"
                            required
                            maxLength={200}
                            defaultValue={item.name}
                            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">가격(원) *</label>
                          <input
                            name="price"
                            type="text"
                            inputMode="numeric"
                            required
                            defaultValue={String(item.price)}
                            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">카테고리</label>
                          <input
                            name="category"
                            maxLength={120}
                            defaultValue={item.category ?? ""}
                            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">표시 순서</label>
                          <input
                            name="sort_order"
                            type="number"
                            min={0}
                            max={2000000}
                            inputMode="numeric"
                            required
                            defaultValue={String(item.sortOrder)}
                            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">설명</label>
                          <textarea
                            name="description"
                            rows={2}
                            maxLength={2000}
                            defaultValue={item.description ?? ""}
                            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                        <div className="sm:col-span-2 flex items-center gap-2">
                          <input
                            id={`sold-out-${item.id}`}
                            name="is_sold_out"
                            type="checkbox"
                            value="on"
                            defaultChecked={item.isSoldOut}
                            className="h-4 w-4 rounded border-chaya-border"
                          />
                          <label htmlFor={`sold-out-${item.id}`} className="text-sm text-zinc-700 dark:text-zinc-300">
                            품절로 표시 (손님 화면에서 담기 비활성)
                          </label>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">새 이미지 파일</label>
                          <input
                            name="file"
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-200 file:px-3 file:py-2 file:text-sm file:font-medium dark:text-zinc-400 dark:file:bg-zinc-800"
                          />
                          <p className="mt-1 text-xs text-zinc-500">선택 시 업로드한 주소가 URL 입력보다 우선합니다.</p>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">이미지 URL</label>
                          <input
                            name="imageUrl"
                            type="url"
                            maxLength={2000}
                            defaultValue={item.imageUrl ?? ""}
                            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <button
                            type="submit"
                            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
                          >
                            변경 저장
                          </button>
                        </div>
                      </form>
                    </details>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
