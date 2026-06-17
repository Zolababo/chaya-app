import Link from "next/link";

import {
  merchantMenuEditHref,
  type MerchantMenuEditTab,
} from "@/lib/merchant/merchant-menu-edit-tab";

const TABS: { id: MerchantMenuEditTab; label: string }[] = [
  { id: "basic", label: "기본" },
  { id: "photo", label: "사진" },
  { id: "advanced", label: "옵션·번역" },
];

const chipActive =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary shadow-sm";
const chipIdle =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-chaya-border bg-chaya-surface px-4 py-2 text-sm font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300";

type Props = {
  tenant: string;
  menuId: string;
  activeTab: MerchantMenuEditTab;
  categoryFilter: string | null;
};

export function MerchantMenuEditTabNav({ tenant, menuId, activeTab, categoryFilter }: Props) {
  return (
    <nav className="mb-6 flex flex-wrap gap-2" aria-label="메뉴 수정 탭">
      {TABS.map((tab) => (
        <Link
          key={tab.id}
          href={merchantMenuEditHref(tenant, menuId, { tab: tab.id, category: categoryFilter })}
          className={activeTab === tab.id ? chipActive : chipIdle}
          aria-current={activeTab === tab.id ? "page" : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
