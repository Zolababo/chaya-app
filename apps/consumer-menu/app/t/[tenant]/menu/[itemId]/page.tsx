import Link from "next/link";
import { notFound } from "next/navigation";

import { MenuItemAddToCart } from "@/components/menu-item-add-to-cart";
import { formatKrw, getMenuById } from "@/lib/menus/queries";

type Props = {
  params: Promise<{ tenant: string; itemId: string }>;
};

export default async function MenuItemPage({ params }: Props) {
  const { tenant, itemId } = await params;
  const item = await getMenuById(tenant, decodeURIComponent(itemId));

  if (!item) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href={`/t/${tenant}`}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-950"
          aria-label="메뉴판으로 돌아가기"
        >
          ← 메뉴
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-chaya-border bg-chaya-surface dark:border-zinc-700 dark:bg-zinc-950">
          {item.imageUrl?.trim() ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={`${item.name} 사진`}
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
            {item.category ?? "메뉴"}
          </p>
          {item.isSoldOut ? (
            <p
              role="status"
              className="mt-2 rounded-lg border border-zinc-300 bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-200"
            >
              현재 품절입니다.
            </p>
          ) : null}
          <h1 className="mt-1 text-2xl font-bold">{item.name}</h1>
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
