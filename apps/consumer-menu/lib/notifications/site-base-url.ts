/** 서버 전용: 배너·알림 링크에 쓸 공개 베이스 URL. */
function toHttpsBase(raw: string): string | null {
  const host = raw.replace(/^https?:\/\//, "").replace(/\/+$/, "").trim();
  if (!host) return null;
  return `https://${host}`;
}

/**
 * 우선순위: 명시 URL → Vercel 고정 프로덕션 호스트 → 배포별 VERCEL_URL.
 * `VERCEL_URL`만 쓰면 프리뷰·배포 전용 호스트가 들어가 링크 탭 시 "Log in to Vercel"로 갈 수 있음.
 */
export function getServerSiteBaseUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const prodHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prodHost) {
    const base = toHttpsBase(prodHost);
    if (base) return base;
  }
  const v = process.env.VERCEL_URL?.trim();
  if (v) return toHttpsBase(v);
  return null;
}
