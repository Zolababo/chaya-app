import { MenuTranslationFields } from "@/components/menu-translation-fields";
import { MerchantMenuMerchandisingFields } from "@/components/merchant-menu-merchandising-fields";
import { createMenuFromForm } from "@/app/m/[tenant]/menus/actions";
import { MERCHANT_OPTIONS_INPUT_PLACEHOLDER } from "@/lib/menus/menu-options";
import {
  MERCHANT_IMAGE_ACCEPT,
  MERCHANT_IMAGE_UPLOAD_HINT,
} from "@/lib/merchant/merchant-image-upload-policy";

type Props = {
  tenant: string;
  categoryFilter: string | null;
};

const fieldClass =
  "mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900";

/** 점주 메뉴 추가 — 필수 항목은 항상 보이고, 나머지는 접어 둠. */
export function MerchantMenuAddSection({ tenant, categoryFilter }: Props) {
  return (
    <section
      className="mb-8 rounded-2xl border-2 border-chaya-primary bg-chaya-primary/5 p-5 dark:border-orange-500 dark:bg-orange-950/25"
      aria-label="메뉴 추가"
    >
      <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">메뉴 추가</h2>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
        이름·가격·카테고리만 넣어도 손님 메뉴판에 바로 나타납니다. 사진은 갤러리에서 선택하세요.
      </p>

      <form
        action={createMenuFromForm}
        encType="multipart/form-data"
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <input type="hidden" name="tenant_slug" value={tenant} />
        {categoryFilter != null ? (
          <input type="hidden" name="preserve_category" value={categoryFilter} />
        ) : null}

        <div className="sm:col-span-2">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" htmlFor="new-name">
            메뉴 이름 *
          </label>
          <input id="new-name" name="name" required maxLength={200} className={fieldClass} />
        </div>

        <div>
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" htmlFor="new-price">
            가격(원) *
          </label>
          <input
            id="new-price"
            name="price"
            type="text"
            inputMode="numeric"
            required
            placeholder="12000"
            className={fieldClass}
          />
        </div>

        <div>
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" htmlFor="new-category">
            카테고리
          </label>
          <input
            id="new-category"
            name="category"
            maxLength={120}
            placeholder={categoryFilter ?? "메인"}
            defaultValue={categoryFilter ?? ""}
            className={fieldClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100" htmlFor="new-file">
            사진 (선택)
          </label>
          <input
            id="new-file"
            name="file"
            type="file"
            accept={MERCHANT_IMAGE_ACCEPT}
            className="mt-1 block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-chaya-primary file:px-3 file:py-2 file:text-sm file:font-medium file:text-chaya-on-primary"
          />
          <p className="mt-1 text-xs text-zinc-500">{MERCHANT_IMAGE_UPLOAD_HINT}</p>
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
          <button
            type="submit"
            className="min-h-[48px] w-full rounded-xl bg-chaya-primary px-4 text-base font-bold text-chaya-on-primary sm:w-auto sm:min-w-[10rem]"
          >
            메뉴 추가
          </button>
        </div>

        <details className="sm:col-span-2 rounded-xl border border-chaya-border bg-white/80 dark:border-zinc-700 dark:bg-zinc-950/80">
          <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            설명·옵션·다국어 등 더 입력하기
          </summary>
          <div className="grid gap-3 border-t border-chaya-border p-4 sm:grid-cols-2 dark:border-zinc-800">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-desc">
                설명
              </label>
              <textarea id="new-desc" name="description" rows={2} maxLength={2000} className={fieldClass} />
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
                className={fieldClass}
              />
              <p className="mt-1 text-xs text-zinc-500">숫자가 작을수록 목록 위쪽</p>
            </div>
            <div className="sm:col-span-2">
              <MerchantMenuMerchandisingFields idPrefix="new" />
            </div>
            <div className="sm:col-span-2">
              <MenuTranslationFields translations={{}} idPrefix="new" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-options">
                옵션
              </label>
              <textarea
                id="new-options"
                name="options_json"
                rows={3}
                maxLength={12000}
                placeholder={MERCHANT_OPTIONS_INPUT_PLACEHOLDER}
                className={`${fieldClass} text-sm`}
              />
              <p className="mt-1 text-xs text-zinc-500">예: 맵기: 순한,보통,매운 (필수)</p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="new-img">
                사진 URL (파일 대신 링크로 넣을 때)
              </label>
              <input id="new-img" name="imageUrl" type="text" maxLength={2000} className={fieldClass} />
            </div>
          </div>
        </details>
      </form>
    </section>
  );
}
