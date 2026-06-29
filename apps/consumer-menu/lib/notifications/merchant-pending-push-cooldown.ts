/** 미처리 주문 재알림 푸시 — 신규 주문 푸시 쿨다운과 분리 */

const PENDING_REALERT_PUSH_COOLDOWN_MS = 45_000;
const MAX_KEYS = 500;

const lastPendingReAlertPushByTenant = new Map<string, number>();

function tenantKey(tenantSlug: string): string {
  return tenantSlug.trim().toLowerCase();
}

function pruneMap(map: Map<string, number>): void {
  if (map.size <= MAX_KEYS) return;
  const oldest = [...map.entries()].sort((a, b) => a[1] - b[1]).slice(0, map.size - MAX_KEYS + 50);
  for (const [k] of oldest) map.delete(k);
}

/** @returns true 이면 이번 cron 틱에서 pending 재알림 푸시 발송 가능 */
export function consumePendingReAlertPushCooldown(tenantSlug: string): boolean {
  const key = tenantKey(tenantSlug);
  if (!key) return true;

  const now = Date.now();
  const last = lastPendingReAlertPushByTenant.get(key) ?? 0;
  if (now - last < PENDING_REALERT_PUSH_COOLDOWN_MS) {
    return false;
  }

  lastPendingReAlertPushByTenant.set(key, now);
  pruneMap(lastPendingReAlertPushByTenant);
  return true;
}
