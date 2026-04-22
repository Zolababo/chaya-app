import Link from "next/link";
import { notFound } from "next/navigation";

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
          className="rounded-full border border-chaya-border bg-chaya-surface px-3 py-2 text-sm font-semibold dark:border-zinc-700 dark:bg-zinc-950"
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
              alt=""
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
          <h1 className="mt-1 text-2xl font-bold">{item.name}</h1>
          <p className="mt-2 text-lg font-semibold text-chaya-primary dark:text-orange-400">
            {formatKrw(item.price)}
          </p>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400">{item.description ?? ""}</p>
          <div className="mt-6 rounded-2xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
            <p className="text-sm font-medium">수량</p>
            <p className="mt-2 text-sm text-zinc-500">QuantityStepper 자리</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-28 left-0 right-0 z-30 flex justify-center px-4">
        <Link
          href={`/t/${tenant}/cart`}
          className="w-full max-w-md rounded-2xl bg-chaya-primary px-6 py-4 text-center text-lg font-bold text-chaya-on-primary shadow-md"
        >
          장바구니에 담기
        </Link>
      </div>
    </div>
  );
}
