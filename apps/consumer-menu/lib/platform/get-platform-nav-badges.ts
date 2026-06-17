import "server-only";

import { getPlatformDashboardSnapshot } from "@/lib/platform/platform-analytics";
import { listPlatformStores } from "@/lib/platform/list-platform-stores";

export type PlatformNavBadges = {
  alertCount: number;
  atRiskCount: number;
};

/** 사이드바·탑바 배지용 — 가벼운 집계 */
export async function getPlatformNavBadges(): Promise<PlatformNavBadges> {
  const [snapshot, storesRes] = await Promise.all([
    getPlatformDashboardSnapshot(),
    listPlatformStores(),
  ]);

  const alertCount = snapshot.ok
    ? snapshot.alerts.filter((a) => a.severity === "urgent").length
    : 0;
  const atRiskCount = storesRes.ok ? storesRes.stores.filter((s) => s.atRisk).length : 0;

  return { alertCount, atRiskCount };
}
