"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

/** 점주앱 브라우저 — 세션 쿠키·Realtime용 (anon + RLS) */
export function createMerchantBrowserClient() {
  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;

  return createBrowserClient(url, anon);
}
