/** 동일 매장 외부 알림 폭주 방지(인스턴스 단위, 서버리스 한계 있음). */

const EMAIL_COOLDOWN_MS = 3 * 60 * 1000;
/** 웹 푸시 — 연속 주문도 놓치지 않도록 짧은 버스트 방지만 */
const PUSH_COOLDOWN_MS = 20 * 1000;
const MAX_KEYS = 500;

const lastEmailByTenant = new Map<string, number>();
const lastPushByTenant = new Map<string, number>();

function tenantKey(tenantSlug: string): string {
  return tenantSlug.trim().toLowerCase();
}

function pruneMap(map: Map<string, number>): void {
  if (map.size <= MAX_KEYS) return;
  const oldest = [...map.entries()].sort((a, b) => a[1] - b[1]).slice(0, map.size - MAX_KEYS + 50);
  for (const [k] of oldest) map.delete(k);
}

function consumeCooldown(map: Map<string, number>, tenantSlug: string, cooldownMs: number, label: string): boolean {
  const key = tenantKey(tenantSlug);
  if (!key) return true;

  const now = Date.now();
  const last = map.get(key) ?? 0;
  if (now - last < cooldownMs) {
    console.warn(`[notification] guest_order ${label} cooldown`, { tenant: key, cooldownMs });
    return false;
  }

  map.set(key, now);
  pruneMap(map);
  return true;
}

/**
 * @returns `true` 이면 이번에 Resend 메일·웹훅 묶음을 진행해도 됨.
 */
export function consumeGuestOrderResendCooldown(tenantSlug: string): boolean {
  return consumeCooldown(lastEmailByTenant, tenantSlug, EMAIL_COOLDOWN_MS, "email");
}

/**
 * @returns `true` 이면 이번에 웹 푸시를 발송해도 됨 (메일 쿨다운과 분리).
 */
export function consumeGuestOrderPushCooldown(tenantSlug: string): boolean {
  return consumeCooldown(lastPushByTenant, tenantSlug, PUSH_COOLDOWN_MS, "push");
}
