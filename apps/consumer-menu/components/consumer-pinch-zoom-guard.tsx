"use client";

import { useEffect } from "react";

/** iOS Safari 등 — viewport만으로 막히지 않는 핀치·멀티터치 줌 완화 */
export function ConsumerPinchZoomGuard() {
  useEffect(() => {
    const blockGesture = (event: Event) => {
      event.preventDefault();
    };

    document.addEventListener("gesturestart", blockGesture, { passive: false });
    document.addEventListener("gesturechange", blockGesture, { passive: false });
    document.addEventListener("gestureend", blockGesture, { passive: false });

    return () => {
      document.removeEventListener("gesturestart", blockGesture);
      document.removeEventListener("gesturechange", blockGesture);
      document.removeEventListener("gestureend", blockGesture);
    };
  }, []);

  return null;
}
