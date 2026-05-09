import { createClient } from "@supabase/supabase-js";

import { getSupabaseServiceRoleKey, getSupabaseServiceUrl } from "./resolve-service-config";

/**
 * 서버 전용. `SUPABASE_SERVICE_ROLE_KEY` 는 클라이언트 번들에 포함되지 않도록
 * 이 팩토리는 Server Component·Server Action 에서만 import 하세요.
 */
export function createServiceSupabase() {
  const url = getSupabaseServiceUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return null;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
