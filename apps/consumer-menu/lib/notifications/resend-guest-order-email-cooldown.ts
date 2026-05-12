/** 동일 매장에 대한 신규주문 외부 알림 폭주 방지(Resend·웹 푸시·웹훅 묶음, 인스턴스 단위, 서버리스 한계 있음). */

const COOLDOWN_MS = 3 * 60 * 1000;
const MAX_KEYS = 500;
const lastAttemptByTenant = new Map<string, number>();

/**
 * @returns `true` 이면 이번에 외부 알림(Resend / 웹 푸시 / 선택 웹훅)을 진행해도 됨. `false` 이면 쿨다운으로 스킵.
 */
export function consumeGuestOrderResendCooldown(tenantSlug: string): boolean {
  const key = tenantSlug.trim().toLowerCase();
  if (!key) return true;

  const now = Date.now();
  const last = lastAttemptByTenant.get(key) ?? 0;
  if (now - last < COOLDOWN_MS) {
    console.warn("[notification] guest_order resend cooldown", { tenant: key, cooldownMs: COOLDOWN_MS });
    return false;
  }

  lastAttemptByTenant.set(key, now);

  if (lastAttemptByTenant.size > MAX_KEYS) {
    const oldest = [...lastAttemptByTenant.entries()].sort((a, b) => a[1] - b[1]).slice(0, lastAttemptByTenant.size - MAX_KEYS + 50);
    for (const [k] of oldest) {
      lastAttemptByTenant.delete(k);
    }
  }

  return true;
}
