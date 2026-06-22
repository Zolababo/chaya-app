import { menuCardListClass } from "@/components/menu-list-styles";
import { menuCardClassForCategoryIndex } from "@/lib/menus/menu-category-tints";
import { sortMenuItemsForDisplay } from "@/lib/menus/category-order";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import type { AppLocale } from "@/lib/i18n/locales";
import { optimizeMenuThumbUrl } from "@/lib/menus/optimize-menu-thumb-url";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import type { ChayaMenuRow } from "@/lib/menus/types";

const SSR_ROW_LIMIT = 8;

type Props = {
  items: ChayaMenuRow[];
  locale: AppLocale;
  id?: string;
};

/** 클라이언트 MenuBoard hydration 전 — h3·썸네일을 HTML에 포함 */
export function MenuBoardServerList({ items, locale, id = "menu-board-ssr" }: Props) {
  const sorted = sortMenuItemsForDisplay(items).slice(0, SSR_ROW_LIMIT);
  if (sorted.length === 0) return null;

  const m = consumerMessages(locale);

  return (
    <ul id={id} aria-label={m.menu.boardTitle} className={menuCardListClass} data-menu-ssr-fallback>
      {sorted.map((raw) => {
        const item = resolveMenuRowForLocale(raw, locale);
        const thumb = optimizeMenuThumbUrl(item.imageUrl, "list");

        return (
          <li
            key={item.id}
            className={`relative ${menuCardClassForCategoryIndex(0)}`}
          >
            <div className="flex items-center gap-2 py-0 sm:gap-2.5">
              {thumb ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumb}
                  alt=""
                  width={64}
                  height={64}
                  className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-16 sm:w-16"
                  loading="lazy"
                  decoding="async"
                  fetchPriority="low"
                />
              ) : (
                <div
                  className="h-16 w-16 shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800"
                  aria-hidden
                />
              )}
              <div className="min-w-0 flex-1 py-0.5">
                <h3 className="text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50">
                  {item.name}
                </h3>
                <p className="mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {formatConsumerMoney(item.price, locale)}
                </p>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
