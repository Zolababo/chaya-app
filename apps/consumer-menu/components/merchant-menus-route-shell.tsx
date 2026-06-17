"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { MerchantMenuCompactList } from "@/components/merchant-menu-compact-list";
import { merchantMenusHref } from "@/lib/merchant/merchant-menus-href";
import { useMerchantWideLandscape } from "@/lib/responsive/use-merchant-wide-landscape";

type Props = {
  tenant: string;
  children: ReactNode;
};

/** `/m/{tenant}/menus/*` 서브 라우트 — 가로에서 목록+편집 2-pane */
export function MerchantMenusRouteShell({ tenant, children }: Props) {
  const wideLandscape = useMerchantWideLandscape();
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const tEnc = encodeURIComponent(tenant);
  const menusPrefix = `/m/${tEnc}/menus`;

  const isNew = pathname === `${menusPrefix}/new`;
  const isSubRoute = pathname.startsWith(`${menusPrefix}/`) && pathname !== menusPrefix;
  const isEditRoute = isNew || isSubRoute;

  let selectedMenuId: string | null = null;
  if (isSubRoute && !isNew) {
    const slug = pathname.slice(`${menusPrefix}/`.length).split("/")[0] ?? "";
    if (slug) selectedMenuId = decodeURIComponent(slug);
  }

  if (!wideLandscape || !isEditRoute) {
    return <>{children}</>;
  }

  const selectMenu = (menuId: string) => {
    router.push(`${menusPrefix}/${encodeURIComponent(menuId)}`);
  };

  return (
    <div className="merchant-menus-two-pane">
      <aside className="merchant-menus-list-pane" aria-label="메뉴 목록">
        {isNew ? (
          <p
            className="mb-2 rounded-xl border border-chaya-primary/30 bg-chaya-primary/10 px-3 py-2.5 text-center text-sm font-bold text-chaya-primary dark:border-orange-500/30 dark:bg-orange-950/30 dark:text-orange-400"
            role="status"
          >
            새 메뉴 등록 중
          </p>
        ) : null}
        <MerchantMenuCompactList
          tenant={tenant}
          selectedMenuId={selectedMenuId}
          onSelectMenu={selectMenu}
        />
      </aside>
      <div className="merchant-menus-detail-pane">{children}</div>
    </div>
  );
}

/** 목록 탭 — 선택 메뉴 유지 */
export function merchantMenusListWithSelection(tenant: string, menuId: string, tab?: Parameters<typeof merchantMenusHref>[1]) {
  return merchantMenusHref(tenant, { ...tab, menuId });
}
