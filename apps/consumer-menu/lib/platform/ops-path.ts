/** `/ops/login` 에서 받는 next 파라미터 검증(오픈 리다이렉트 방지). */
export function sanitizeOpsNextPath(raw: string | undefined | null): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s.startsWith("/ops")) return null;
  if (s.startsWith("//") || s.includes("://")) return null;
  if (s === "/ops/login" || s.startsWith("/ops/login?")) return "/ops";
  return s;
}

export function opsLoginUrl(nextPath?: string | null): string {
  const next = sanitizeOpsNextPath(nextPath);
  if (next) return `/ops/login?next=${encodeURIComponent(next)}`;
  return "/ops/login";
}
