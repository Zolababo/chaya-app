import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

/**
 * Next.js 서버(Server Component·Server Action)에서 세션 쿠키를 읽고 갱신하는 Supabase 클라이언트.
 * 배포에는 `NEXT_PUBLIC_SUPABASE_URL`(또는 `SUPABASE_URL`)·`NEXT_PUBLIC_SUPABASE_ANON_KEY` 가 필요합니다.
 */
export async function createSupabaseServerClient() {
  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return null;

  const cookieStore = await cookies();

  return createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as CookieOptions | undefined),
          );
        } catch {
          // Server Components에서 허용되지 않는 재검증 경로에서는 쿠키를 못 고칠 수 있음.
        }
      },
    },
  });
}
