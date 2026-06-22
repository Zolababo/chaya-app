import type { User } from "@supabase/supabase-js";

import type { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

type ServerSupabase = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

/**
 * `/live/*` 폴링·캐시 API — 쿠키 세션 우선 (getUser Auth 서버 왕복 생략).
 * 세션이 없거나 만료 직전이면 getUser()로 검증합니다.
 */
export async function resolveServerUserForLiveApi(supabase: ServerSupabase): Promise<User | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const sessionUser = session?.user ?? null;
  if (sessionUser && session) {
    const expiresAt = session.expires_at;
    if (typeof expiresAt === "number" && expiresAt * 1000 > Date.now() + 60_000) {
      return sessionUser;
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user ?? sessionUser;
}

/**
 * 서버 렌더링 중 `getUser()` 호출이 일시적으로 실패할 때를 대비해
 * 세션 쿠키 기반 `getSession()` 사용자로 한 번 폴백합니다.
 */
export async function resolveServerUser(supabase: ServerSupabase): Promise<User | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (user) return user;
  if (!error) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user ?? null;
}
