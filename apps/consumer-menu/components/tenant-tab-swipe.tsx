"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { withConsumerLang } from "@/lib/i18n/with-consumer-lang";

type Props = {
  tenant: string;
  children: ReactNode;
};

const TAB_SUFFIXES = ["", "/cart", "/orders"] as const;

function tabIndexForPath(pathname: string, tenant: string): number {
  const base = `/t/${encodeURIComponent(tenant.trim())}`;
  if (pathname === base || pathname === `${base}/`) return 0;
  if (pathname === `${base}/cart` || pathname === `${base}/cart/`) return 1;
  if (pathname === `${base}/orders` || pathname === `${base}/orders/`) return 2;
  return -1;
}

/** 메뉴·장바구니·주문 허브에서 좌우 스와이프로 탭 이동. */
export function TenantTabSwipe({ tenant, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useConsumerLocale();
  const tabIndex = tabIndexForPath(pathname, tenant);

  useEffect(() => {
    if (tabIndex < 0) return;
    const el = document.getElementById("main-content");
    if (!el) return;

    let startX = 0;
    let startY = 0;

    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const onEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.35) return;

      const next =
        dx < 0 ? Math.min(2, tabIndex + 1) : Math.max(0, tabIndex - 1);
      if (next === tabIndex) return;

      const slug = tenant.trim();
      const path = `/t/${encodeURIComponent(slug)}${TAB_SUFFIXES[next]}`;
      router.push(withConsumerLang(path, locale));
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [tabIndex, tenant, locale, router]);

  return children;
}
