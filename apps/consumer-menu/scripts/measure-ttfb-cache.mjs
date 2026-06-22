#!/usr/bin/env node
/** TTFB + Vercel cache 헤더 — revalidate 제거 영향 점검용 */
const url = process.argv[2] || "https://chaya-app.vercel.app/t/demo";
const runs = Math.max(10, Number(process.env.PERF_RUNS) || 30);

function percentile(sorted, p) {
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

const ttft = [];
const cache = { HIT: 0, MISS: 0, STALE: 0, other: 0 };

for (let i = 0; i < runs; i++) {
  const t0 = performance.now();
  const res = await fetch(`${url}${url.includes("?") ? "&" : "?"}_=${Date.now()}_${i}`, {
    headers: { "Cache-Control": "no-cache" },
  });
  await res.body?.cancel?.();
  ttft.push(Math.round(performance.now() - t0));
  const vc = res.headers.get("x-vercel-cache") || res.headers.get("cf-cache-status") || "none";
  if (vc.includes("HIT")) cache.HIT++;
  else if (vc.includes("MISS") || vc === "none") cache.MISS++;
  else if (vc.includes("STALE")) cache.STALE++;
  else cache.other++;
}

const sorted = [...ttft].sort((a, b) => a - b);
const mid = Math.floor(sorted.length / 2);
const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);

console.log(
  JSON.stringify(
    {
      url,
      runs,
      ttfbMs: {
        min: sorted[0],
        median,
        p95: percentile(sorted, 95),
        max: sorted[sorted.length - 1],
      },
      vercelCache: cache,
      note: "revalidate=60 제거 시 x-vercel-cache MISS 위주 → TTFB는 서버 SSR 매 요청. p95 스파이크는 cold start+분산.",
    },
    null,
    2,
  ),
);
