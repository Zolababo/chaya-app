import type { PlatformStoreSummary } from "@/lib/platform/list-platform-stores";

export type OnboardingFunnelStageId =
  | "signed_up"
  | "first_menu"
  | "qr_issued"
  | "first_order"
  | "active_7d";

export type OnboardingFunnelStage = {
  id: OnboardingFunnelStageId;
  label: string;
  count: number;
  /** 이전 단계 대비 전환율 (%) */
  conversionFromPrev: number | null;
};

export type OnboardingFunnelSnapshot = {
  stages: OnboardingFunnelStage[];
  /** 1→5 전체 전환율 */
  overallConversion: number;
};

export function buildOnboardingFunnel(stores: PlatformStoreSummary[]): OnboardingFunnelSnapshot {
  const signedUp = stores.filter((s) => s.approvedMemberCount > 0).length;
  const firstMenu = stores.filter((s) => s.menuCount > 0).length;
  const qrIssued = stores.filter((s) => s.activeTableCount > 0).length;
  const firstOrder = stores.filter((s) => s.hasOrderEver).length;
  const active7d = stores.filter((s) => s.ordersLast7d > 0).length;

  const counts = [signedUp, firstMenu, qrIssued, firstOrder, active7d];
  const labels: { id: OnboardingFunnelStageId; label: string }[] = [
    { id: "signed_up", label: "가입·승인" },
    { id: "first_menu", label: "메뉴 첫 등록" },
    { id: "qr_issued", label: "QR 발급" },
    { id: "first_order", label: "첫 주문" },
    { id: "active_7d", label: "7일 내 주문 (활성)" },
  ];

  const stages: OnboardingFunnelStage[] = labels.map((l, i) => {
    const count = counts[i] ?? 0;
    const prev = i > 0 ? (counts[i - 1] ?? 0) : null;
    const conversionFromPrev =
      prev != null && prev > 0 ? Math.round((count / prev) * 100) : i === 0 ? null : 0;
    return { id: l.id, label: l.label, count, conversionFromPrev };
  });

  const overallConversion =
    signedUp > 0 ? Math.round((active7d / signedUp) * 100) : 0;

  return { stages, overallConversion };
}
