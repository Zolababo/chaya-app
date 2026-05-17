import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuItemAddToCart } from "@/components/menu-item-add-to-cart";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
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
    <div className="space-y-8" aria-labelledby="menu-item-heading">
      <div className="flex items-center gap-3">
        <Link
          href={`/t/${tenant}`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-950"
          aria-label={m.menu.detailBack}
        >
          ← {m.nav.menu}
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-chaya-border bg-chaya-surface dark:border-zinc-700 dark:bg-zinc-950">
          {item.imageUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={`${item.name}`}
              className="aspect-square w-full object-cover"
            />
          ) : (
            <div
              className="aspect-square bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900"
              aria-hidden
            />
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-chaya-muted dark:text-zinc-400">
            {item.category ?? m.menu.categoryFallback}
          </p>
          {item.isSoldOut ? (
            <p
              role="status"
              className="mt-2 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {m.menu.soldOutBanner}
            </p>
          ) : null}
          <h1 id="menu-item-heading" className="mt-1 text-2xl font-bold">
            {item.name}
          </h1>
          <p className="mt-2 text-lg font-semibold text-chaya-primary dark:text-orange-400">
            {formatKrw(item.price)}
          </p>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">{item.description ?? ""}</p>
        </div>
      </div>

      <MenuItemAddToCart tenant={tenant} item={item} />
    </div>
  );
}
