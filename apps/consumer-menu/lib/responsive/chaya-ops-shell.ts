/**
 * CHAYA 플랫폼 `/ops/*` 셸 — **터치·폰 = 컴팩트**, **PC(마우스) = 데스크톱**.
 * 브레이크포인트: `lib/responsive/ops-desktop-view.ts` · CSS `globals.css`
 */

export const chayaOpsShellClass = "chaya-app-shell chaya-app-shell--ops";

export const chayaOpsContentClass = "w-full";

/** 모바일·태블릿 세로: 하단 5탭. 넓은 가로(1024+)에서만 사이드바·탑바 */
export const opsCompactNavClass = "ops-compact-nav";

export const opsDesktopSidebarClass = "ops-desktop-sidebar";

export const opsDesktopTopbarClass = "ops-desktop-topbar";

export const opsCompactHeaderClass = "ops-compact-header";

export const opsConsoleRootClass = "ops-console-root";

export const opsMainColumnClass = "ops-main-column";

export const opsMainScrollClass = "ops-main-scroll";

export const opsCompactNavWrapClass = "ops-compact-nav-wrap";

export const opsConsoleContentClass = "ops-console-content";

export const opsDesktopOnlyClass = "ops-desktop-only";

export const opsCompactOnlyClass = "ops-compact-only";

export const opsStoresTwoPaneClass = "ops-stores-two-pane";

export const opsStoresListPaneClass = "ops-stores-list-pane";

export const opsStoresDetailPaneClass = "ops-stores-detail-pane";

/** `/ops/stores/{slug}` — 가로 2열 본문 */
export const opsStoreDetailLayoutClass = "ops-store-detail-layout";

export const opsStoreDetailColLeftClass = "ops-store-detail-col-left space-y-4";

export const opsStoreDetailColRightClass = "ops-store-detail-col-right space-y-4";

export const opsStoreDetailKpiGridClass = "ops-store-detail-kpi-grid grid grid-cols-2 gap-2 sm:grid-cols-4";

export const opsShellWithCompactNavClass = "ops-shell-with-compact-nav";

/** ops KPI 4열 · 2/3열 · 비율 분할 그리드 (1024+ 가로) */
export const opsKpiGridClass = "ops-kpi-grid";

export const opsGrid2ColClass = "ops-grid-2";

export const opsGrid3ColClass = "ops-grid-3";

export const opsGridSplit14Class = "ops-grid-split-14";

export const opsGridSplit15Class = "ops-grid-split-15";

export const opsPageHeaderClass = "ops-page-header border-b border-ops-border-2";

export const opsPageTitleClass = "ops-page-title mt-1 font-bold text-ops-text";

export const opsKpiTileClass = "ops-kpi-tile rounded-2xl border";

export const opsKpiTileValueClass = "ops-kpi-tile-value mt-1 font-extrabold tabular-nums whitespace-nowrap text-ops-text";

export const opsSectionCardClass = "ops-section-card rounded-2xl border border-ops-border bg-ops-surface shadow-[0_2px_8px_rgba(0,0,0,0.3)]";

export const opsSectionCardTitleClass = "ops-section-card-title font-extrabold text-ops-text";
