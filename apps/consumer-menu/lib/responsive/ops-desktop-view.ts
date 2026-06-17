/**
 * CHAYA `/ops/*` — 모바일(터치) vs PC(마우스) 분리.
 * 가로/세로가 아니라 **입력 장치**로 셸을 고릅니다.
 */

/** PC: 사이드바·탑바 (하단 탭·컴팩트 헤더 숨김) */
export const OPS_DESKTOP_VIEW_MEDIA = "(hover: hover) and (pointer: fine)";

/** PC + 넓은 창: KPI 4열·매장 2-pane 등 */
export const OPS_DESKTOP_WIDE_MEDIA =
  "(hover: hover) and (pointer: fine) and (min-width: 1024px)";

/** @deprecated 이름 유지 — wide 2-pane용 */
export const OPS_WIDE_LANDSCAPE_MEDIA = OPS_DESKTOP_WIDE_MEDIA;
