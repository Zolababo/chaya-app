import type { PlatformDashboardSnapshot } from "@/lib/platform/platform-analytics";

function formatWon(n: number): string {
  return `${n.toLocaleString("ko-KR")}원`;
}

/** 아침 브리핑 푸시 본문 미리보기 (발송 연동 전) */
export function buildMorningBriefingText(snapshot: Extract<PlatformDashboardSnapshot, { ok: true }>): string {
  const lines = [
    `☀️ CHAYA 플랫폼 브리핑 · ${snapshot.dateLabel}`,
    "",
    `💰 오늘 매출 ${formatWon(snapshot.totalSalesToday)} (${snapshot.totalOrdersToday}건)`,
    `🟢 영업중 ${snapshot.health.operatingToday}곳 / 전체 ${snapshot.health.totalStores}곳`,
    `📋 30일 활성 ${snapshot.health.orderStores30d}곳 · 이탈위험 ${snapshot.health.churnRisk14d}곳`,
  ];

  if (snapshot.alerts.length > 0) {
    lines.push("", "🚨 즉시 확인:");
    for (const a of snapshot.alerts.slice(0, 3)) {
      lines.push(`· ${a.message}`);
    }
  }

  if (snapshot.rankings.length > 0) {
    const top = snapshot.rankings[0];
    lines.push("", `🏆 오늘 1위 ${top.displayName} (${formatWon(top.todaySales)})`);
  }

  lines.push("", "— CHAYA Admin");
  return lines.join("\n");
}
