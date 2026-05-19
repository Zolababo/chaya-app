import { BarrierFreeMenuClient } from "./barrier-free-menu-client";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { collectCategories, listMenusForTenant } from "@/lib/menus/queries";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function BarrierFreeMenuPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const sp = await searchParams;
  const locale = await getConsumerLocale(typeof sp.lang === "string" ? sp.lang : null);
  const m = consumerMessages(locale);
  const result = await listMenusForTenant(tenant);
  const categories = collectCategories(result.items);

  const dataLabel = !result.ok
    ? m.barrierFree.dataFail
    : result.source === "demo"
      ? m.barrierFree.dataDemo
      : m.barrierFree.dataDb;

  return (
    <div className="space-y-6" aria-labelledby="barrier-free-heading">
      <header className="space-y-2">
        <h1 id="barrier-free-heading" className="text-3xl font-extrabold leading-tight tracking-tight">
          {m.barrierFree.pageTitle}
        </h1>
        <p className="text-base leading-relaxed text-zinc-700 dark:text-zinc-300">{m.barrierFree.pageIntro}</p>
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

      <p className="text-center text-xs text-chaya-muted dark:text-zinc-500">{dataLabel}</p>
    </div>
  );
}
