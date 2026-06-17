import { MerchantMenuListRow } from "@/components/merchant-menu-list-row";
import type { ChayaMenuRow } from "@/lib/menus/types";

type Props = {
  tenant: string;
  items: ChayaMenuRow[];
  categoryFilter: string | null;
  canDeleteMenus: boolean;
  listLabel?: string;
};

export function MerchantMenuCatalog({
  tenant,
  items,
  categoryFilter,
  canDeleteMenus,
  listLabel = "등록된 메뉴",
}: Props) {
  if (items.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">표시할 메뉴가 없습니다.</p>
    );
  }

  return (
    <ul aria-label={listLabel} className="space-y-2.5">
      {items.map((item) => (
        <MerchantMenuListRow
          key={item.id}
          tenant={tenant}
          item={item}
          categoryFilter={categoryFilter}
          canDeleteMenus={canDeleteMenus}
        />
      ))}
    </ul>
  );
}
