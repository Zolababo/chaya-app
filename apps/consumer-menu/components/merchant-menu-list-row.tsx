import Link from "next/link";

import { MerchantConfirmSubmitButton } from "@/components/merchant-confirm-submit";
import { MerchantMenuPriceInline } from "@/components/merchant-menu-price-inline";
import { MenuListThumb } from "@/components/menu-list-thumb";
import {
  deleteMenuFromForm,
  setMenuSoldOutFromForm,
  updateMenuPriceFromForm,
} from "@/app/m/[tenant]/menus/actions";
import type { ChayaMenuRow } from "@/lib/menus/types";
import { formatKrw } from "@/lib/menus/queries";

type Props = {
  tenant: string;
  item: ChayaMenuRow;
  categoryFilter: string | null;
  canDeleteMenus: boolean;
};

const actionBtn =
  "inline-flex h-10 flex-1 items-center justify-center rounded-lg text-xs font-bold transition";
const actionPrimary = `${actionBtn} bg-chaya-primary text-chaya-on-primary`;
const actionOutline = `${actionBtn} border border-chaya-border text-zinc-800 dark:border-zinc-600 dark:text-zinc-100`;
const actionSoldOut = `${actionBtn} border border-amber-500 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100`;
const actionDanger = `${actionBtn} border border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`;

export function MerchantMenuListRow({ tenant, item, categoryFilter, canDeleteMenus }: Props) {
  const t = encodeURIComponent(tenant);
  const editHref = `/m/${t}/menus/${encodeURIComponent(item.id)}`;
  const categoryLabel = item.category?.trim() || "기타";
  const badges: string[] = [];
  if (item.isSoldOut) badges.push("품절");
  if (item.isTodaysPick) badges.push("오늘");
  if (item.isStoreRecommended) badges.push("Pick");

  return (
    <li className="overflow-hidden rounded-xl border border-chaya-border bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex gap-3 p-3">
        <MenuListThumb imageUrl={item.imageUrl} />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-bold text-zinc-900 dark:text-zinc-50">{item.name}</h3>
            <p className="shrink-0 text-sm font-bold tabular-nums text-zinc-700 dark:text-zinc-200">
              {formatKrw(item.price)}
            </p>
          </div>
          <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">{categoryLabel}</p>
          {badges.length > 0 ? (
            <p className="mt-1 flex flex-wrap gap-1">
              {badges.map((b) => (
                <span
                  key={b}
                  className={
                    b === "품절"
                      ? "rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-950 dark:bg-amber-950/60 dark:text-amber-100"
                      : "rounded-full bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-chaya-primary dark:bg-zinc-800 dark:text-orange-400"
                  }
                >
                  {b}
                </span>
              ))}
            </p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-chaya-border bg-zinc-50/80 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
        <form action={updateMenuPriceFromForm} className="flex flex-wrap items-center justify-between gap-2">
          <input type="hidden" name="tenant_slug" value={tenant} />
          <input type="hidden" name="menu_id" value={item.id} />
          {categoryFilter != null ? (
            <input type="hidden" name="preserve_category" value={categoryFilter} />
          ) : null}
          <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">판매가 수정</span>
          <MerchantMenuPriceInline menuId={item.id} menuName={item.name} initialPrice={item.price} />
        </form>

        <div
          className={`mt-2.5 grid gap-2 ${canDeleteMenus ? "grid-cols-3" : "grid-cols-2"}`}
          role="group"
          aria-label={`${item.name} 작업`}
        >
          <form action={setMenuSoldOutFromForm} className="min-w-0">
            <input type="hidden" name="tenant_slug" value={tenant} />
            <input type="hidden" name="menu_id" value={item.id} />
            <input type="hidden" name="is_sold_out" value={item.isSoldOut ? "false" : "true"} />
            {categoryFilter != null ? (
              <input type="hidden" name="preserve_category" value={categoryFilter} />
            ) : null}
            <button type="submit" className={`w-full ${item.isSoldOut ? actionOutline : actionSoldOut}`}>
              {item.isSoldOut ? "품절 해제" : "품절"}
            </button>
          </form>
          <Link href={editHref} className={actionPrimary}>
            수정
          </Link>
          {canDeleteMenus ? (
            <form action={deleteMenuFromForm} className="min-w-0">
              <input type="hidden" name="tenant_slug" value={tenant} />
              <input type="hidden" name="menu_id" value={item.id} />
              {categoryFilter != null ? (
                <input type="hidden" name="preserve_category" value={categoryFilter} />
              ) : null}
              <MerchantConfirmSubmitButton confirmMessage={`「${item.name}」메뉴를 삭제할까요?`} className={`w-full ${actionDanger}`}>
                삭제
              </MerchantConfirmSubmitButton>
            </form>
          ) : null}
        </div>
      </div>
    </li>
  );
}
