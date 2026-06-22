"use client";

import dynamic from "next/dynamic";

const ConsumerPinchZoomGuard = dynamic(
  () => import("@/components/consumer-pinch-zoom-guard").then((m) => m.ConsumerPinchZoomGuard),
  { ssr: false },
);

export function ConsumerPinchZoomDeferred() {
  return <ConsumerPinchZoomGuard />;
}
