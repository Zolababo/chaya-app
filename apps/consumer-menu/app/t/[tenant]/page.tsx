import { MenuBoard } from "@/components/menu-board";
import { collectCategories, listMenusForTenant } from "@/lib/menus/queries";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MenuHomePage({ params }: Props) {
  const { tenant } = await params;
  const result = await listMenusForTenant(tenant);
  const categories = collectCategories(result.items);

  return (
    <div className="space-y-6">
      {result.notice ? (
        <p
          role={result.ok ? "status" : "alert"}
          className={
            result.ok
              ? "rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
              : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          }
        >
          {result.notice}
        </p>
      ) : null}

      <section
        className="rounded-2xl bg-chaya-info p-4 text-white shadow-md"
        aria-labelledby="info-heading"
      >
        <h2 id="info-heading" className="text-lg font-semibold leading-tight">
          Self-Bar Location
        </h2>
        <p className="mt-1 text-sm text-white/90">
          Visit the center aisle for fresh kimchi, sauces, and utensils.
        </p>
      </section>

      {result.items.length === 0 ? (
        <p className="text-center text-sm text-chaya-muted dark:text-zinc-400">
          표시할 메뉴가 없습니다.
        </p>
      ) : (
        <MenuBoard tenant={tenant} items={result.items} categories={categories} />
      )}

      <p className="text-center text-xs text-chaya-muted dark:text-zinc-500">
        데이터:{" "}
        {!result.ok
          ? "연결 문제로 데모 목록 표시 중"
          : result.source === "demo"
            ? "로컬 데모"
            : "Supabase ChayaMenus"}
        {result.source === "demo" && result.ok
          ? " — `.env`에 NEXT_PUBLIC_SUPABASE_* 를 넣으면 실제 메뉴를 불러옵니다."
          : null}
      </p>
    </div>
  );
}
