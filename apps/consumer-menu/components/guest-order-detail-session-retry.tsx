"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { syncGuestSessionCookieFromBrowser } from "@/lib/guest-session/sync-guest-session-cookie";

/**
 * 첫 RSC 요청 시점에는 쿠키가 아직 없을 수 있음. `localStorage`에 세션이 있으면 쿠키를 맞춘 뒤 한 번만 새로고침합니다.
 * (잘못된 주문 URL이면 세션이 있어도 계속 없음 — 추가 요청 1회만 발생.)
 */
export function GuestOrderDetailSessionRetry() {
  const router = useRouter();
  const tried = useRef(false);

  useEffect(() => {
    if (tried.current) return;
    let sid: string | null = null;
    try {
      sid = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    } catch {
      return;
    }
    if (!sid || sid.length < 8) return;

    tried.current = true;
    syncGuestSessionCookieFromBrowser();
    router.refresh();
  }, [router]);

  return null;
}
