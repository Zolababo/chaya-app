"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useEffectiveScreenReaderMode } from "@/lib/consumer/use-effective-screen-reader-mode";
import {
  isMenuHomePath,
  isScreenReaderMenuPath,
  menuPathForScreenReaderMode,
} from "@/lib/consumer/screen-reader-routes";
import { useConsumerNavHref } from "@/lib/i18n/use-consumer-nav-href";

type Props = {
  tenant: string;
};

/** SR 모드와 메뉴 URL(barrier-free ↔ 기본) 동기화 */
export function ConsumerScreenReaderRouteSync({ tenant }: Props) {
  const { screenReaderMode, hydrated } = useEffectiveScreenReaderMode(tenant);
  const pathname = usePathname();
  const router = useRouter();
  const navHref = useConsumerNavHref(tenant);
  const lastMode = useRef(screenReaderMode);

  useEffect(() => {
    if (!hydrated) return;

    lastMode.current = screenReaderMode;

    if (screenReaderMode) {
      document.getElementById("menu-board-ssr")?.remove();
    }

    if (screenReaderMode && isMenuHomePath(pathname, tenant)) {
      router.replace(navHref(menuPathForScreenReaderMode(tenant, true)));
      return;
    }

    if (!screenReaderMode && isScreenReaderMenuPath(pathname)) {
      router.replace(navHref(menuPathForScreenReaderMode(tenant, false)));
    }
  }, [hydrated, screenReaderMode, pathname, tenant, router, navHref]);

  return null;
}
