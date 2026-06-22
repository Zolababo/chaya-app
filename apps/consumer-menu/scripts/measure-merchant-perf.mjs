#!/usr/bin/env node
/**
 * 점주앱 화면별 HTTP + Supabase 벤치 (1회 실행 후 삭제 가능)
 * Usage: node scripts/measure-merchant-perf.mjs [tenant] [baseUrl]
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnvFile(path) {
  try {
    const text = readFileSync(path, "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      const key = t.slice(0, i);
      let val = t.slice(i + 1);
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

loadEnvFile(resolve(root, ".env.prod-root"));
loadEnvFile(resolve(root, ".env.production.local"));
loadEnvFile(resolve(root, ".env.local"));

const BENCH_SECRET = process.env.CHAYA_BENCH_SECRET || "chaya-bench-local";
process.env.CHAYA_BENCH_SECRET = BENCH_SECRET;

const baseUrl = process.argv[3] || process.env.BENCH_BASE_URL || "http://127.0.0.1:3000";
let tenant = process.argv[2] || process.env.BENCH_TENANT || "";

async function pickTenant() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return "demo";
  const res = await fetch(
    `${url}/rest/v1/merchant_tenant_members?select=tenant_slug&approved_at=not.is.null&limit=1`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    },
  );
  if (!res.ok) return "demo";
  const rows = await res.json();
  return rows?.[0]?.tenant_slug || "demo";
}

async function curlTiming(label, url, headers = {}) {
  const t0 = performance.now();
  const res = await fetch(url, { headers, redirect: "manual" });
  const body = await res.arrayBuffer();
  const totalMs = Math.round(performance.now() - t0);
  return {
    label,
    url,
    status: res.status,
    totalMs,
    bytes: body.byteLength,
  };
}

async function main() {
  if (!tenant) tenant = await pickTenant();

  console.log(JSON.stringify({ phase: "config", baseUrl, tenant, benchSecretSet: Boolean(BENCH_SECRET) }, null, 2));

  const benchUrl = `${baseUrl}/m/${encodeURIComponent(tenant)}/live/bench`;
  const bench = await curlTiming("supabase_breakdown", benchUrl, {
    "x-chaya-bench-secret": BENCH_SECRET,
  });

  let supabaseData = null;
  if (bench.status === 200) {
    const res = await fetch(benchUrl, { headers: { "x-chaya-bench-secret": BENCH_SECRET } });
    supabaseData = await res.json();
  }

  const httpTargets = [
    { label: "ssr_login", url: `${baseUrl}/m/login` },
    { label: "ssr_dashboard", url: `${baseUrl}/m/${encodeURIComponent(tenant)}/dashboard` },
    { label: "live_dashboard", url: `${baseUrl}/m/${encodeURIComponent(tenant)}/live/dashboard` },
    { label: "live_orders_all", url: `${baseUrl}/m/${encodeURIComponent(tenant)}/live/orders?tab=all` },
    { label: "live_menus", url: `${baseUrl}/m/${encodeURIComponent(tenant)}/live/menus` },
    { label: "live_analytics_7d", url: `${baseUrl}/m/${encodeURIComponent(tenant)}/live/analytics?days=7` },
    { label: "live_ops", url: `${baseUrl}/m/${encodeURIComponent(tenant)}/live/ops` },
  ];

  const http = [];
  for (const t of httpTargets) {
    http.push(await curlTiming(t.label, t.url));
  }

  const prodBase = "https://chaya-app.vercel.app";
  const prodHttp = [];
  for (const t of httpTargets.slice(0, 4)) {
    prodHttp.push(await curlTiming(`prod_${t.label}`, `${prodBase}${t.url.replace(baseUrl, "")}`));
  }

  const report = {
    measuredAt: new Date().toISOString(),
    tenant,
    supabaseBench: {
      httpMs: bench.totalMs,
      status: bench.status,
      data: supabaseData,
    },
    localHttp: http,
    productionHttp: prodHttp,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
