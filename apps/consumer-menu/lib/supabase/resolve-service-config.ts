/**
 * Supabase 서버(서비스 롤) 클라이언트용 URL·키 해석.
 * Vercel/대시보드에서 이름이 살짝 다른 경우까지 흔한 별칭으로 보조합니다.
 */
function normalizeQuoted(raw: string | undefined): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  let s = String(raw).trim();
  if (!s) return undefined;
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    s = s.slice(1, -1).trim();
  }
  return s || undefined;
}

/** 공개 프로젝트 URL (손님 번들과 동일 프로젝트면 동일 문자열 권장). */
export function getSupabaseServiceUrl(): string | undefined {
  return (
    normalizeQuoted(process.env.NEXT_PUBLIC_SUPABASE_URL) ??
    normalizeQuoted(process.env.SUPABASE_URL)
  );
}

/** 서버 전용 service_role 비밀 키. */
export function getSupabaseServiceRoleKey(): string | undefined {
  return (
    normalizeQuoted(process.env.SUPABASE_SERVICE_ROLE_KEY) ??
    normalizeQuoted(process.env.SUPABASE_SECRET_KEY)
  );
}

export function isServiceSupabaseConfigured(): boolean {
  const url = getSupabaseServiceUrl();
  const key = getSupabaseServiceRoleKey();
  if (!url || !key) return false;
  if (url.length < 12 || key.length < 20) return false;
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
