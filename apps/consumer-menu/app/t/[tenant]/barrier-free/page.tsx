import { BarrierFreeMenuClient } from "./barrier-free-menu-client";
import { collectCategories, listMenusForTenant } from "@/lib/menus/queries";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function BarrierFreeMenuPage({ params }: Props) {
  const { tenant } = await params;
  const result = await listMenusForTenant(tenant);
  const categories = collectCategories(result.items);

  return (
    <div className="space-y-6" aria-labelledby="barrier-free-heading">
      <header className="space-y-2">
        <h1 id="barrier-free-heading" className="text-2xl font-bold">
          목록형 메뉴
        </h1>
        <p className="text-sm text-chaya-muted dark:text-zinc-400">
          모바일에서 TalkBack·VoiceOver 등으로 읽기 쉽게 줄인 보조 화면입니다. 터치로도 그대로 사용할 수 있으며, 담기는 아래 메뉴·장바구니와 같은 저장소를
          씁니다. 기본 메뉴판이 더 편하면 하단 내비의 「메뉴판」으로 돌아가면 됩니다.
        </p>
      </header>

      {result.notice ? (
        <p
          role={result.ok ? "status" : "alert"}
          aria-live={result.ok ? "polite" : "assertive"}
          className={
            result.ok
              ? "rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300"
              : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
          }
        >
          {result.notice}
        </p>
      ) : null}

      <BarrierFreeMenuClient tenant={tenant} items={result.items} categories={categories} />

      <p className="text-center text-xs text-chaya-muted dark:text-zinc-500">
        데이터:{" "}
        {!result.ok
          ? "연결 실패로 데모 목록 사용 중"
          : result.source === "demo"
            ? "로컬 데모"
            : "Supabase ChayaMenus"}
      </p>
    </div>
  );
}
