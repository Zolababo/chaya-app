import type { User } from "@supabase/supabase-js";

import type { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

type ServerSupabase = NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;

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
