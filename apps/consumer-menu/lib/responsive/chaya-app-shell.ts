/**
 * CHAYA 손님·점주 세로(포트rait) 공통 셸.
 * 실제 max-width·safe-area는 `app/globals.css` 의 `.chaya-app-shell*` 규칙.
 */

/** 손님 `/t/*` — 본문·하단 nav·장바구니 bar 정렬 */
export const chayaConsumerShellClass = "chaya-app-shell chaya-app-shell--consumer";

/** 점주 `/m/{tenant}/*` — 4탭 SPA 본문 */
export const chayaMerchantShellClass = "chaya-app-shell chaya-app-shell--merchant";

/** 하단 고정 nav / sticky bar 내부 — 본문과 동일 max-width */
export const chayaAppShellNavInnerClass = "chaya-app-shell__nav-inner";

/** sticky 탭·툴바가 셸 패딩까지 풀-bleed 할 때 */
export const chayaAppShellBleedClass = "chaya-app-shell-bleed";

/** 폰·태블릿 세로: 하단 4탭. 넓은 가로(1024+)에서만 숨김 */
export const merchantCompactNavClass = "merchant-compact-nav";

/** 넓은 가로 전용 상단 서브내비 */
export const merchantDesktopSubnavClass = "merchant-desktop-subnav";

/** 점주 본문 — compact nav 있을 때 하단 여백 */
export const merchantShellWithCompactNavClass = "merchant-shell-with-compact-nav";

/** 점주 서브페이지(`more`, `tables` 등) — 가로에서 sticky 헤더 */
export const merchantSubpageHeaderClass = "merchant-subpage-header";

/** 손님 본문 — 레이아웃 셸 안에서 전체 너비 (중복 max-w-lg/max-w-md 방지) */
export const chayaConsumerContentClass = "w-full";

/** 로그인·역할 선택 등 — 좁은 인증 컬럼 (28rem) */
export const chayaAuthShellClass = "chaya-app-shell chaya-app-shell--auth";

/** 점주 분석·주문 가로 레이아웃 래퍼 */
export const merchantAnalyticsBodyClass = "merchant-analytics-body";
export const merchantAnalyticsChartsStackClass = "merchant-analytics-charts-stack";

/** 점주 홈(대시보드) — 가로: 매출 요약 | 주문·메뉴 빠른 액션 */
export const merchantDashboardBodyClass = "merchant-dashboard-body";

export const merchantDashboardSummaryPaneClass = "merchant-dashboard-summary-pane";

export const merchantDashboardOpsPaneClass = "merchant-dashboard-ops-pane";
