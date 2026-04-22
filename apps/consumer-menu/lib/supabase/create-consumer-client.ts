import { createClient } from "@supabase/supabase-js";

/**
 * 소비자 메뉴 앱용 공개 anon 클라이언트.
 * 세션 저장 없음 — 서버 컴포넌트에서 매 요청 생성해도 무방합니다.
 */
export function createConsumerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;

  return createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
