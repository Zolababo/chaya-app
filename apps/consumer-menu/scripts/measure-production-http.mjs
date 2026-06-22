#!/usr/bin/env node
/** HTTP 타이밍 — median 5 runs */
const PROD = "https://chaya-app.vercel.app";
const LOCAL = process.argv[2] || null;
const TENANT = process.argv[3] || "demo";
const BENCH_SECRET = "chaya-measure-202606";
const RUNS = 5;

async function timeFetch(label, url, headers = {}) {
  const ms = [];
  let last = { status: 0, bytes: 0 };
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    const res = await fetch(url, { headers, redirect: "manual" });
    const buf = await res.arrayBuffer();
    ms.push(Math.round(performance.now() - t0));
    last = { status: res.status, bytes: buf.byteLength };
  }
  ms.sort((a, b) => a - b);
  const median = ms[Math.floor(ms.length / 2)];
  return { label, url, medianMs: median, runs: ms, ...last };
}

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

async function main() {
  const base = LOCAL || PROD;
  const tEnc = encodeURIComponent(TENANT);
  const targets = [
    ["cold_ssr_login", `${base}/m/login`],
    ["cold_ssr_dashboard", `${base}/m/${tEnc}/dashboard`],
    ["live_dashboard_unauth", `${base}/m/${tEnc}/live/dashboard`],
    ["live_orders_unauth", `${base}/m/${tEnc}/live/orders?tab=all`],
    ["live_menus_unauth", `${base}/m/${tEnc}/live/menus`],
    ["live_analytics_unauth", `${base}/m/${tEnc}/live/analytics?days=7`],
    ["live_ops_unauth", `${base}/m/${tEnc}/live/ops`],
    ["live_bench_supabase", `${base}/m/${tEnc}/live/bench`],
  ];

  const http = [];
  for (const [label, url] of targets) {
    const headers =
      label === "live_bench_supabase" ? { "x-chaya-bench-secret": BENCH_SECRET } : {};
    http.push(await timeFetch(label, url, headers));
  }

  let supabase = null;
  const bench = http.find((h) => h.label === "live_bench_supabase");
  if (bench?.status === 200) {
    const res = await fetch(bench.url, { headers: { "x-chaya-bench-secret": BENCH_SECRET } });
    supabase = await res.json();
  }

  const ranked = supabase?.top3Slowest ?? [];

  console.log(
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        base,
        tenant: TENANT,
        runsPerEndpoint: RUNS,
        http,
        supabaseBreakdown: supabase,
        top3SlowestScreens: ranked,
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
