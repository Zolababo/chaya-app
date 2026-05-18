import { ConsumerOrderFlowBanner } from "@/components/consumer-order-flow-banner";
import { MenuBoard } from "@/components/menu-board";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { collectCategories, listMenusForTenant } from "@/lib/menus/queries";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ lang?: string }>;
};

export default async function MenuHomePage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { lang } = await searchParams;
  const locale = await getConsumerLocale(lang);
  const m = consumerMessages(locale);
  const result = await listMenusForTenant(tenant);
  const categories = collectCategories(result.items);

  return (
    <div className="space-y-4 sm:space-y-5">
      <h1 id="menu-home-heading" className="sr-only">
        {m.menu.boardTitle}
      </h1>

      <ConsumerOrderFlowBanner steps={[m.flow.step1, m.flow.step2, m.flow.step3]} activeStep={1} />

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

      {result.items.length === 0 ? (
        <p className="text-center text-sm text-chaya-muted dark:text-zinc-400">{m.menu.empty}</p>
      ) : (
        <MenuBoard tenant={tenant} items={result.items} categories={categories} />
      )}

    </div>
  );
}
