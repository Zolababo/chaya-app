import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

/** `/t/{tenant}/*` 로만 리다이렉트 허용. */
export function sanitizeConsumerNextPath(
  raw: string | null | undefined,
  tenant: string,
): string | null {
  const slug = normalizeTenantSlug(tenant);
  if (!slug) return null;
  if (!raw) return null;
  const s = raw.trim();
  if (s.length > 500) return null;
  if (/^https?:/i.test(s) || s.startsWith("//")) return null;
  const prefix = `/t/${slug}`;
  if (!s.startsWith(prefix)) return null;
  if (s.includes("..") || s.includes("\\")) return null;
  return s;
}

export function consumerLoginUrl(tenant: string, nextPath?: string | null): string {
  const slug = normalizeTenantSlug(tenant) ?? tenant;
  const u = new URL(`/t/${encodeURIComponent(slug)}/login`, "http://local");
  const next = nextPath ? sanitizeConsumerNextPath(nextPath, slug) : null;
  if (next) u.searchParams.set("next", next);
  return `${u.pathname}${u.search}`;
}
