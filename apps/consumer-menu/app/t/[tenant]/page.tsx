import { MenuHomeDeferredClient } from "@/components/menu-home-deferred-client";
import { collectCategories, listMenusForTenantBoard } from "@/lib/menus/queries";
import {
  categoryLabelsRecord,
  toMenuBoardClientRows,
} from "@/lib/menus/menu-board-client-row";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ lang?: string }>;
};

/** 메뉴 홈 — SSR 목록·공지는 layout `MenuHomeEarlySsr`, 여기는 client island만 */
export default async function MenuHomePage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { lang } = await searchParams;
  const locale = await getConsumerLocale(lang);
  const result = await listMenusForTenantBoard(tenant);

  if (result.items.length === 0) {
    return null;
  }

  const categories = collectCategories(result.items);
  const clientItems = toMenuBoardClientRows(result.items, locale);
  const categoryLabels = categoryLabelsRecord(result.items, categories, locale);

  return (
    <MenuHomeDeferredClient
      tenant={tenant}
      items={clientItems}
      categories={categories}
      categoryLabels={categoryLabels}
    />
  );
}
