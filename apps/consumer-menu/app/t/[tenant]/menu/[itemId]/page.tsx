import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuItemAddToCart } from "@/components/menu-item-add-to-cart";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";
import { formatKrw, getMenuById } from "@/lib/menus/queries";
import { resolveMenuRowForLocale } from "@/lib/menus/resolve-menu-text";

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
      className="mx-auto max-w-lg pb-[calc(max(4.25rem,env(safe-area-inset-bottom)+3.75rem)+7.5rem)]"
      aria-labelledby="menu-item-heading"
    >
      <Link
        href={withConsumerLang(`/t/${tenant}`, locale)}
        className="mb-3 inline-flex min-h-[40px] items-center text-sm font-semibold text-chaya-primary dark:text-orange-400"
        aria-label={m.menu.detailBack}
      >
        ← {m.nav.menu}
      </Link>

      <div className="overflow-hidden rounded-xl border border-zinc-200/90 bg-white dark:border-zinc-800 dark:bg-zinc-950">
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
        <div className="px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            {item.category ?? m.menu.categoryFallback}
          </p>
          {item.isSoldOut ? (
            <p
              role="status"
              className="mt-2 rounded-lg bg-zinc-100 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {m.menu.soldOutBanner}
            </p>
          ) : null}
          <h1 id="menu-item-heading" className="mt-1 text-xl font-bold leading-snug tracking-tight">
            {item.name}
          </h1>
          <p className="mt-1 text-lg font-bold tabular-nums text-chaya-primary dark:text-orange-400">
            {formatKrw(item.price)}
          </p>
          {(item.description ?? "").trim() ? (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {item.description}
            </p>
          ) : null}
        </div>
      </div>

      <MenuItemAddToCart tenant={tenant} item={item} />
    </div>
  );
}
