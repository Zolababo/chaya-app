import Link from "next/link";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MenuHomePage({ params }: Props) {
  const { tenant } = await params;

  return (
    <div className="space-y-6">
      <section
        className="rounded-xl border-2 border-blue-600 bg-blue-600 p-4 text-white"
        aria-labelledby="info-heading"
      >
        <h2 id="info-heading" className="text-lg font-semibold">
          Self-Bar Location
        </h2>
        <p className="mt-1 text-sm opacity-90">
          Visit the center aisle for fresh kimchi, sauces, and utensils.
        </p>
      </section>

      <nav className="flex gap-2 overflow-x-auto pb-2" aria-label="카테고리">
        {["Korean Food", "Side Dishes", "Drinks", "Desserts"].map((cat, i) => (
          <button
            key={cat}
            type="button"
            className={
              i === 0
                ? "shrink-0 rounded-full bg-orange-700 px-5 py-3 text-sm font-semibold text-white"
                : "shrink-0 rounded-full border-2 border-zinc-200 bg-white px-5 py-3 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
            }
          >
            {cat}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <article className="overflow-hidden rounded-3xl border-2 border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-950">
          <div className="h-40 bg-zinc-200 dark:bg-zinc-800" aria-hidden />
          <div className="p-4">
            <h3 className="text-lg font-semibold">Classic Bibimbap</h3>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
              Steamed rice with seasonal vegetables and spicy gochujang.
            </p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-lg font-semibold text-orange-800 dark:text-orange-400">
                ₩12,000
              </span>
              <Link
                href={`/t/${tenant}/menu/sample`}
                className="rounded-2xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                상세
              </Link>
            </div>
          </div>
        </article>
      </div>

      <p className="text-center text-xs text-zinc-500">
        스티치 레이아웃 연결용 플레이스홀더입니다. 데이터 연동은 이후 단계에서 합니다.
      </p>
    </div>
  );
}
