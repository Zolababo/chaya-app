/** 일반 손님 메뉴 — 핀치 줌 OFF */
export const CONSUMER_VIEWPORT_PINCH_LOCKED = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
} as const;

/** 베리어프리(SR) ON — 핀치 줌 허용 */
export const CONSUMER_VIEWPORT_PINCH_ALLOWED = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
} as const;

const PINCH_ZOOM_ATTR = "data-consumer-pinch-zoom";

let lastPinchZoomAllowed: boolean | null = null;

function viewportPolicy(allowPinchZoom: boolean) {
  return allowPinchZoom
    ? CONSUMER_VIEWPORT_PINCH_ALLOWED
    : CONSUMER_VIEWPORT_PINCH_LOCKED;
}

export function consumerViewportMetaContent(allowPinchZoom: boolean): string {
  const policy = viewportPolicy(allowPinchZoom);
  return [
    `width=${policy.width}`,
    `initial-scale=${policy.initialScale}`,
    `minimum-scale=${policy.minimumScale}`,
    `maximum-scale=${policy.maximumScale}`,
    `viewport-fit=cover`,
    `user-scalable=${policy.userScalable ? "yes" : "no"}`,
  ].join(", ");
}

function writeViewportMeta(meta: Element, content: string, replaceNode: boolean): void {
  if (!replaceNode) {
    meta.setAttribute("content", content);
    return;
  }
  const next = document.createElement("meta");
  next.setAttribute("name", "viewport");
  next.setAttribute("content", content);
  meta.parentNode?.replaceChild(next, meta);
}

/**
 * viewport + touch-action 만 담당. `data-consumer-screen-reader-mode` 는 SR Provider 전용.
 * 동일 상태면 no-op — 탭 이동 시 viewport 교체로 화면 깜빡임 방지.
 */
export function applyConsumerPinchZoomPolicy(allowPinchZoom: boolean): void {
  if (lastPinchZoomAllowed === allowPinchZoom) return;
  lastPinchZoomAllowed = allowPinchZoom;

  const content = consumerViewportMetaContent(allowPinchZoom);
  document.querySelectorAll('meta[name="viewport"]').forEach((meta) => {
    writeViewportMeta(meta, content, true);
  });

  const root = document.documentElement;
  if (allowPinchZoom) {
    root.setAttribute(PINCH_ZOOM_ATTR, "allowed");
  } else {
    root.removeAttribute(PINCH_ZOOM_ATTR);
  }
}

/** 테스트·부트 스크립트 동기화용 */
export function resetConsumerPinchZoomPolicyCache(): void {
  lastPinchZoomAllowed = null;
}
