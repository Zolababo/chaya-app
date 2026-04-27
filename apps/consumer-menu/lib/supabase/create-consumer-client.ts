import { createClient } from "@supabase/supabase-js";

function isPlausibleSupabaseUrl(url: string): boolean {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    if (u.hostname.length < 3) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * 소비자 메뉴 앱용 공개 anon 클라이언트.
 * 세션 저장 없음 — 서버 컴포넌트에서 매 요청 생성해도 무방합니다.
 */
export function createConsumerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;
  if (!isPlausibleSupabaseUrl(url) || anon.length < 20) return null;

  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
