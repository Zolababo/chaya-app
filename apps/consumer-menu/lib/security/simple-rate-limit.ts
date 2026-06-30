import type { NextRequest } from "next/server";

/** 서버리스 인스턴스별 메모리 한계 — 분산 Redis 전까지 1차 완화용 */
const buckets = new Map<string, number[]>();

const MAX_BUCKET_KEYS = 5000;

function pruneOld(now: number, windowMs: number) {
  if (buckets.size <= MAX_BUCKET_KEYS) return;
  for (const [k, arr] of buckets) {
    const kept = arr.filter((t) => now - t < windowMs);
    if (kept.length === 0) buckets.delete(k);
    else buckets.set(k, kept);
  }
}

/** @returns true 이면 제한 초과(요청 거부 권장) */
export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  pruneOld(now, windowMs);
  const arr = buckets.get(key) ?? [];
  const kept = arr.filter((t) => now - t < windowMs);
  if (kept.length >= max) {
    buckets.set(key, kept);
    return true;
  }
  kept.push(now);
  buckets.set(key, kept);
  return false;
}

export function rateLimitKeyFromRequest(request: NextRequest, routeSuffix: string): string {
  const xf = request.headers.get("x-forwarded-for");
  const first = xf?.split(",")[0]?.trim();
  const ip = first || request.headers.get("x-real-ip")?.trim() || "unknown";
  return `${routeSuffix}:${ip}`;
}

/** Server Actions — `headers()` 기준 IP 키 */
export async function rateLimitKeyFromHeaders(routeSuffix: string): Promise<string> {
  const { headers } = await import("next/headers");
  const h = await headers();
  const xf = h.get("x-forwarded-for");
  const first = xf?.split(",")[0]?.trim();
  const ip = first || h.get("x-real-ip")?.trim() || "unknown";
  return `${routeSuffix}:${ip}`;
}

