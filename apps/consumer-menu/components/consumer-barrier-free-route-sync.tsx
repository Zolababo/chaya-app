"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
import {
  isBarrierFreeMenuPath,
  isMenuHomePath,
  menuPathForEasyMode,
} from "@/lib/consumer/easy-mode-routes";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";

type Props = {
  tenant: string;
};

/** 베리어프리 ON ↔ 메뉴 URL(`/barrier-free`) 동기화 — 장바구니·주문 URL은 유지 */
export function ConsumerBarrierFreeRouteSync({ tenant }: Props) {
  const { barrierFreeMode, hydrated } = useConsumerEasyMode();
  const pathname = usePathname();
  const router = useRouter();
  const navHref = useConsumerNavHref(tenant);

  useEffect(() => {
    if (!hydrated) return;

    if (barrierFreeMode) {
      document.getElementById("menu-board-ssr")?.remove();
    }

    if (barrierFreeMode && isMenuHomePath(pathname, tenant)) {
      router.replace(navHref(menuPathForEasyMode(tenant, true)));
      return;
    }

    if (!barrierFreeMode && isBarrierFreeMenuPath(pathname)) {
      router.replace(navHref(menuPathForEasyMode(tenant, false)));
    }
  }, [hydrated, barrierFreeMode, pathname, tenant, router, navHref]);

  return null;
}
