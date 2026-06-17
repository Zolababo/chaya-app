import { notFound } from "next/navigation";

import { ExperienceTrackMenuView } from "@/components/experience-track-menu-view";
import { MenuItemAddToCart } from "@/components/menu-item-add-to-cart";
import { MenuItemBackLink } from "@/components/menu-item-back-link";
import { MenuItemSpiceLine } from "@/components/menu-item-spice-line";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { formatConsumerMoney } from "@/lib/i18n/format-consumer-money";
import { getMenuById } from "@/lib/menus/queries";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";
import { chayaConsumerContentClass } from "@/lib/responsive/chaya-app-shell";

type Props = {
  params: Promise<{ tenant: string; itemId: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function MenuItemPage({ params, searchParams }: Props) {
  const { tenant, itemId } = await params;
  const { lang } = await searchParams;
  const locale = await getConsumerLocale(lang);
  const m = consumerMessages(locale);
  const raw = await getMenuById(tenant, decodeURIComponent(itemId));

  if (!raw) {
    notFound();
  }

  const item = resolveMenuRowForLocale(raw, locale);

  return (
    <div
      className={`${chayaConsumerContentClass} pb-[calc(var(--chaya-consumer-nav-clearance)+7.5rem)]`}
      aria-labelledby="menu-item-heading"
    >
      <ExperienceTrackMenuView tenant={tenant} menuId={item.id} />
      <MenuItemBackLink tenant={tenant} />

      <div className="overflow-hidden rounded-2xl bg-chaya-surface shadow-sm ring-1 ring-black/[0.03] dark:bg-zinc-900 dark:ring-white/5">
        {item.imageUrl?.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="h-44 w-full object-cover sm:h-52"
          />
        ) : (
          <div
            className="flex h-32 items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900"
            aria-hidden
          >
            <span className="text-4xl font-bold text-zinc-400">{item.name.charAt(0)}</span>
          </div>
        )}
        <div className="px-4 py-4">
          <span className="inline-block rounded-md bg-chaya-primary/10 px-2 py-0.5 text-xs font-medium text-chaya-primary dark:bg-orange-950/50 dark:text-orange-300">
            {item.category ?? m.menu.categoryFallback}
          </span>
          {item.isSoldOut ? (
            <p
              role="status"
              className="mt-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {m.menu.soldOutBanner}
            </p>
          ) : null}
          <h1 id="menu-item-heading" className="mt-2 text-xl font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50">
            {item.name}
          </h1>
          <p
            id="menu-item-detail-price"
            className="mt-1 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50"
          >
            {formatConsumerMoney(item.price, locale)}
          </p>
          {(item.description ?? "").trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {item.description}
            </p>
          ) : null}
          <MenuItemSpiceLine
            locale={locale}
            spiceLevel={item.spiceLevel}
            spiceAriaLabel={
              item.spiceLevel && item.spiceLevel > 0
                ? m.menu.spiceLevelAria.replace("{level}", String(item.spiceLevel))
                : ""
            }
          />
        </div>
      </div>

      <MenuItemAddToCart tenant={tenant} item={item} />
    </div>
  );
}
