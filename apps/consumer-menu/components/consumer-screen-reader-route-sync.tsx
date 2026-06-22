"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { useConsumerScreenReaderMode } from "@/lib/consumer/consumer-screen-reader-mode-context";
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
  const { screenReaderMode } = useConsumerScreenReaderMode();
  const pathname = usePathname();
  const router = useRouter();
  const navHref = useConsumerNavHref(tenant);
  const lastMode = useRef(screenReaderMode);

  useEffect(() => {
    const modeChanged = lastMode.current !== screenReaderMode;
    lastMode.current = screenReaderMode;

    if (screenReaderMode && isMenuHomePath(pathname, tenant)) {
      router.replace(navHref(menuPathForScreenReaderMode(tenant, true)));
      return;
    }

    if (!screenReaderMode && isScreenReaderMenuPath(pathname)) {
      router.replace(navHref(menuPathForScreenReaderMode(tenant, false)));
      return;
    }

    if (modeChanged && screenReaderMode && isScreenReaderMenuPath(pathname)) {
      /* 이미 SR 메뉴 — 유지 */
    }
  }, [screenReaderMode, pathname, tenant, router, navHref]);

  return null;
}
