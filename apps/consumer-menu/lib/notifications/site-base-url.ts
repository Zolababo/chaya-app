/** 서버 전용: 배너·알림 링크에 쓸 공개 베이스 URL. */
export function getServerSiteBaseUrl(): string | null {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }
  const v = process.env.VERCEL_URL?.trim();
  if (v) {
    const host = v.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }
  return null;
}
