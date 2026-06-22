/**
 * 소비자 perf 스크립트 공통 CDP throttle 프로파일
 *
 * - koreaLte / storeWifi: 파일럿 KPI (한국 LTE·매장 Wi-Fi 추정)
 * - fast3g: 회귀 가드 (기존 합성 baseline 비교용)
 */

function mbps(n) {
  return Math.floor((n * 1024 * 1024) / 8);
}

function kbps(n) {
  return Math.floor((n * 1024) / 8);
}

export const CONSUMER_THROTTLE_PROFILES = {
  /** 파일럿 primary — 한국 LTE (손님 휴대폰, 실내·콘텐츠 경쟁 반영) */
  koreaLte: {
    label: "Korea LTE (pilot primary)",
    downloadThroughput: mbps(12),
    uploadThroughput: mbps(6),
    latency: 28,
    note: "추정: ~12Mbps down, ~28ms latency (SK/KT LTE 실내·혼잡 보수)",
  },
  /** 파일럿 primary — 매장 Wi-Fi (게스트 AP, 대역폭 여유·낮은 RTT) */
  storeWifi: {
    label: "Store Wi-Fi (pilot primary)",
    downloadThroughput: mbps(35),
    uploadThroughput: mbps(12),
    latency: 12,
    note: "추정: ~35Mbps down, ~12ms latency (소형 매장 AP·손님 1명 콜드)",
  },
  /** 회귀 가드 — 기존 Fast 3G 합성 (Chrome DevTools 프리셋) */
  fast3g: {
    label: "Fast 3G (regression guard)",
    downloadThroughput: mbps(1.6),
    uploadThroughput: kbps(750),
    latency: 562.5,
    note: "Chrome DevTools Fast 3G — KPI 아님, 회귀만",
  },
};

export const PILOT_PRIMARY_PROFILE_KEYS = ["koreaLte", "storeWifi"];
export const REGRESSION_GUARD_PROFILE_KEYS = ["fast3g"];

export const DEFAULT_PILOT_PROFILE = "koreaLte";

export function resolveThrottleProfile(key) {
  const k = key || process.env.BENCH_PROFILE || DEFAULT_PILOT_PROFILE;
  const profile = CONSUMER_THROTTLE_PROFILES[k];
  if (!profile) {
    throw new Error(`Unknown BENCH_PROFILE: ${k}`);
  }
  return { key: k, profile };
}
