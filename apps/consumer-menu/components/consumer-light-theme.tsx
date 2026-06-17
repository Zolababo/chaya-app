"use client";

import { useLayoutEffect } from "react";

const ATTR = "data-chaya-consumer";

/** 손님 `/t/*`: OS·Chrome 다크 설정과 무관하게 항상 라이트 테마. */
export function applyConsumerLightTheme(): void {
  const el = document.documentElement;
  el.setAttribute(ATTR, "");
  el.style.colorScheme = "only light";
  el.classList.remove("dark");
}

export function clearConsumerLightTheme(): void {
  const el = document.documentElement;
  el.removeAttribute(ATTR);
  el.style.colorScheme = "";
}

export function ConsumerLightTheme() {
  useLayoutEffect(() => {
    applyConsumerLightTheme();
    return clearConsumerLightTheme;
  }, []);
  return null;
}
