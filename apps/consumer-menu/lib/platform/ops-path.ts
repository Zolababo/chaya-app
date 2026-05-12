import { sanitizeInternalRedirectPath } from "@/lib/security/internal-redirect-path";

/** `/ops/login` 에서 받는 next 파라미터 검증(오픈 리다이렉트 방지). */
export function sanitizeOpsNextPath(raw: string | undefined | null): string | null {
  return sanitizeInternalRedirectPath(raw, "ops");
}

export function opsLoginUrl(nextPath?: string | null): string {
  const next = sanitizeOpsNextPath(nextPath);
  if (next) return `/ops/login?next=${encodeURIComponent(next)}`;
  return "/ops/login";
}
