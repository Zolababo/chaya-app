import { MenuBoardServerList } from "@/components/menu-board-server-list";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";
import { listMenusForTenantBoard } from "@/lib/menus/queries";

type Props = {
  tenant: string;
};

/**
 * 메뉴 홈 — layout에서 `{children}` 보다 먼저 flush.
 * page의 client flight보다 SSR h3가 HTML 스트림 앞쪽에 오도록.
 */
export async function MenuHomeEarlySsr({ tenant }: Props) {
  const locale = await getConsumerLocale();
  const m = consumerMessages(locale);
  const result = await listMenusForTenantBoard(tenant);

  return (
    <>
      <h1 id="menu-home-heading" className="sr-only">
        {m.menu.boardTitle}
      </h1>

      {result.notice ? (
        <p
          role={result.ok ? "status" : "alert"}
          aria-live={result.ok ? "polite" : "assertive"}
          className={
            result.ok
              ? "rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 text-sm text-zinc-700"
              : "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          }
        >
          {result.notice}
        </p>
      ) : null}

      {result.items.length === 0 ? (
        <p className="text-center text-sm text-chaya-muted">{m.menu.empty}</p>
      ) : (
        <MenuBoardServerList items={result.items} locale={locale} />
      )}
    </>
  );
}
