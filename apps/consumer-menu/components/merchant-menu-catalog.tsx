import Link from "next/link";

import { MenuTranslationFields } from "@/components/menu-translation-fields";
import { MerchantConfirmSubmitButton } from "@/components/merchant-confirm-submit";
import { MerchantFormSubmit } from "@/components/merchant-form-submit";
import { MenuListRow } from "@/components/menu-list-row";
import { menuFlatListClass, menuFlatListItemClass } from "@/components/menu-list-styles";
import { LOCALE_META, TRANSLATION_LOCALES } from "@/lib/i18n/locales";
import {
  deleteMenuFromForm,
  setMenuSoldOutFromForm,
  updateMenuFromForm,
  uploadMenuImageOnlyFromForm,
} from "@/app/m/[tenant]/menus/actions";
import { MERCHANT_OPTIONS_INPUT_PLACEHOLDER } from "@/lib/menus/menu-options";
import { stringifyMenuOptionGroups } from "@/lib/menus/list-menus-for-merchant";
import type { ChayaMenuRow } from "@/lib/menus/types";
import { formatKrw } from "@/lib/menus/queries";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categoryFilter: string | null;
  canDeleteMenus: boolean;
  listLabel?: string;
};

export function MerchantMenuCatalog({
  tenant,
  items,
  categoryFilter,
  canDeleteMenus,
  listLabel = "메뉴 목록",
}: Props) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">표시할 메뉴가 없습니다.</p>
    );
  }

  return (
    <ul
      aria-label={listLabel}
      className={menuFlatListClass}
    >
      {items.map((item) => (
        <li key={item.id}>
          <div className={menuFlatListItemClass}>
            <MenuListRow
              name={item.name}
              description={item.description}
              priceLabel={
                item.category ? `${formatKrw(item.price)} · ${item.category}` : formatKrw(item.price)
              }
              imageUrl={item.imageUrl}
              soldOut={item.isSoldOut}
              soldOutLabel="품절"
              trailing={
                <div className="flex flex-col items-stretch justify-center gap-1">
                  <form action={setMenuSoldOutFromForm} className="contents">
                    <input type="hidden" name="tenant_slug" value={tenant} />
                    <input type="hidden" name="menu_id" value={item.id} />
                    <input type="hidden" name="is_sold_out" value={item.isSoldOut ? "false" : "true"} />
                    {categoryFilter != null ? (
                      <input type="hidden" name="preserve_category" value={categoryFilter} />
                    ) : null}
                    <button
                      type="submit"
                      className={
                        item.isSoldOut
                          ? "min-h-[40px] rounded-xl border border-chaya-border px-2.5 text-xs font-semibold text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
                          : "min-h-[40px] rounded-xl border border-amber-600/50 bg-amber-50 px-2.5 text-xs font-semibold text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100"
                      }
                    >
                      {item.isSoldOut ? "품절 해제" : "품절"}
                    </button>
                  </form>
                  {canDeleteMenus ? (
                    <form action={deleteMenuFromForm}>
                      <input type="hidden" name="tenant_slug" value={tenant} />
                      <input type="hidden" name="menu_id" value={item.id} />
                      {categoryFilter != null ? (
                        <input type="hidden" name="preserve_category" value={categoryFilter} />
                      ) : null}
                      <MerchantConfirmSubmitButton
                        confirmMessage={`「${item.name}」메뉴를 삭제할까요?`}
                        className="min-h-[40px] w-full rounded-xl border border-red-300 px-2.5 text-xs font-semibold text-red-700 dark:border-red-800 dark:text-red-300"
                      >
                        삭제
                      </MerchantConfirmSubmitButton>
                    </form>
                  ) : null}
                </div>
              }
            />
            <p className="mt-2 px-1 text-[11px] text-zinc-500 dark:text-zinc-500 sm:px-2">
              표시 순서 {item.sortOrder}
              <span className="mx-1" aria-hidden>
                ·
              </span>
              <Link
                href={`/t/${encodeURIComponent(tenant)}/menu/${encodeURIComponent(item.id)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-chaya-primary underline-offset-2 hover:underline dark:text-orange-400"
              >
                손님 화면 미리보기
              </Link>
              {TRANSLATION_LOCALES.slice(0, 3).map((loc) => (
                <span key={loc}>
                  <span className="mx-1" aria-hidden>
                    ·
                  </span>
                  <Link
                    href={`/t/${encodeURIComponent(tenant)}/menu/${encodeURIComponent(item.id)}?lang=${encodeURIComponent(loc)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-zinc-600 underline-offset-2 hover:underline dark:text-zinc-400"
                    lang={loc}
                  >
                    {LOCALE_META[loc].shortLabel}
                  </Link>
                </span>
              ))}
            </p>
          </div>

          <details className="border-t border-chaya-border px-3 py-2 dark:border-zinc-800">
            <summary className="cursor-pointer list-none text-sm font-medium text-chaya-primary marker:content-none dark:text-orange-400">
              <span className="inline-flex min-h-[44px] items-center">이 메뉴 수정 (사진·가격·옵션)</span>
            </summary>

            <form
              action={uploadMenuImageOnlyFromForm}
              encType="multipart/form-data"
              noValidate
              className="mt-3 rounded-xl border border-chaya-primary/30 bg-chaya-primary/5 p-4 dark:border-orange-900/40 dark:bg-orange-950/20"
            >
              <input type="hidden" name="tenant_slug" value={tenant} />
              <input type="hidden" name="menu_id" value={item.id} />
              {categoryFilter != null ? (
                <input type="hidden" name="preserve_category" value={categoryFilter} />
              ) : null}
              <p className="text-sm font-semibold text-chaya-primary dark:text-orange-400">메뉴 사진</p>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt="" className="mt-2 h-28 w-28 rounded-lg object-cover" />
              ) : (
                <p className="mt-2 text-sm text-zinc-500">등록된 사진이 없습니다.</p>
              )}
              <label className="mt-3 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                갤러리에서 사진 선택 (JPEG·PNG·HEIC, 5MB 이하)
              </label>
              <input
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/*"
                className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-chaya-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-chaya-on-primary"
              />
              <div className="mt-3">
                <MerchantFormSubmit
                  label="사진만 저장"
                  pendingLabel="업로드 중…"
                  className="min-h-[44px] rounded-xl bg-chaya-primary px-4 py-2 text-sm font-bold text-chaya-on-primary disabled:opacity-60"
                />
              </div>
            </form>

            <form
              action={updateMenuFromForm}
              encType="multipart/form-data"
              noValidate
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
                <p className="mt-1 text-xs text-zinc-500">작을수록 손님 목록에서 위에 표시됩니다.</p>
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
                  품절로 표시
                </label>
              </div>
              <div className="sm:col-span-2">
                <MenuTranslationFields translations={item.translations} idPrefix={`edit-${item.id}`} />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">옵션</label>
                <textarea
                  name="options_json"
                  rows={3}
                  maxLength={12000}
                  placeholder={MERCHANT_OPTIONS_INPUT_PLACEHOLDER}
                  defaultValue={stringifyMenuOptionGroups(item.optionGroups)}
                  className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
                />
                <p className="mt-1 text-xs text-zinc-500">
                  예: <span className="font-mono">맵기: 순한,보통,매운 (필수)</span>
                </p>
              </div>
              <div className="sm:col-span-2">
                <MerchantFormSubmit
                  label="변경 저장"
                  pendingLabel="저장 중…"
                  className="w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
                />
              </div>
            </form>
          </details>
        </li>
      ))}
    </ul>
  );
}
