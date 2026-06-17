"use client";

import { useEffect } from "react";

import { ensureGuestSessionInBrowser } from "@/lib/guest-session/ensure-guest-session";

/** `/t/{tenant}` 진입 시 비회원 UUID 생성(장바구니 제출 전). */
export function GuestSessionInit() {
  useEffect(() => {
    ensureGuestSessionInBrowser();
  }, []);

  return null;
}
