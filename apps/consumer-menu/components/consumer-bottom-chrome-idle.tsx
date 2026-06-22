"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const BottomNav = dynamic(
  () => import("@/components/bottom-nav").then((m) => m.BottomNav),
  { ssr: false },
);

const MenuCartStickyBar = dynamic(
  () => import("@/components/menu-cart-sticky-bar").then((m) => m.MenuCartStickyBar),
  { ssr: false },
);

const IDLE_TIMEOUT_MS = 3000;

type Props = {
  tenant: string;
};

/** 하단 네비·장바구니 바 — 메뉴 텍스트 paint 이후 idle 로드 */
export function ConsumerBottomChromeIdle({ tenant }: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(() => setReady(true), { timeout: IDLE_TIMEOUT_MS });
      return () => cancelIdleCallback(id);
    }
    const t = window.setTimeout(() => setReady(true), 0);
    return () => window.clearTimeout(t);
  }, []);

  if (!ready) return null;

  return (
    <>
      <MenuCartStickyBar tenant={tenant} />
      <BottomNav tenant={tenant} />
    </>
  );
}
