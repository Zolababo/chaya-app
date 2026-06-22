#!/usr/bin/env node
/**
 * EXPLAIN ANALYZE for merchant analytics + guest insights queries.
 * Requires DATABASE_URL or SUPABASE_DB_PASSWORD (linked project pooler).
 *
 * Usage:
 *   SUPABASE_DB_PASSWORD=... node scripts/explain-merchant-analytics.mjs [tenant]
 *   DATABASE_URL=postgresql://... node scripts/explain-merchant-analytics.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const tenant = process.argv[2] || "demo";
const PROJECT_REF = "kzxdrwdfqhwpkqbswutr";

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i);
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val && !process.env[key]) process.env[key] = val;
  }
}

loadEnv(resolve(root, ".env.local"));

function buildDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  const pw = process.env.SUPABASE_DB_PASSWORD?.trim();
  if (!pw) return null;
  const enc = encodeURIComponent(pw);
  return `postgresql://postgres.${PROJECT_REF}:${enc}@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres`;
}

const since = new Date(Date.now() - 7 * 864e5).toISOString();
const until = new Date().toISOString();

const QUERIES = [
  {
    name: "merchant_analytics_core_base_cte",
    sql: `
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
WITH base AS (
  SELECT created_at, total_price, status, cancel_reason
  FROM orders
  WHERE tenant_slug = '${tenant}'
    AND created_at >= '${since}'
    AND created_at <= '${until}'
  ORDER BY created_at DESC
  LIMIT 2500
)
SELECT count(*) FROM base;
`,
  },
  {
    name: "store_visits_period_scan",
    sql: `
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT guest_session_id, completed_at, total_price, items
FROM store_visits
WHERE tenant_slug = '${tenant}'
  AND completed_at >= '${since}'
  AND completed_at <= '${until}'
ORDER BY completed_at DESC;
`,
  },
  {
    name: "tenant_guest_rollups_lookup",
    sql: `
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT guest_session_id, completed_visit_count, lifetime_spend, last_completed_at
FROM tenant_guest_rollups
WHERE tenant_slug = '${tenant}'
  AND guest_session_id = ANY(
    SELECT DISTINCT guest_session_id FROM store_visits
    WHERE tenant_slug = '${tenant}'
      AND completed_at >= '${since}'
      AND completed_at <= '${until}'
    LIMIT 50
  );
`,
  },
];

async function main() {
  const dbUrl = buildDatabaseUrl();
  if (!dbUrl) {
    console.log(
      JSON.stringify(
        {
          ok: false,
          reason: "Set DATABASE_URL or SUPABASE_DB_PASSWORD to run EXPLAIN on production DB",
          fallbackAnalysis: {
            productionTableStats: {
              orders_rows: 81,
              orders_seq_scans: 17441,
              idx_orders_tenant_created_scans: 13111,
              store_visits_rows: 28,
              idx_store_visits_tenant_completed_scans: 50,
            },
            expectedPlans: {
              merchant_analytics_core:
                "Should use idx_orders_tenant_created (tenant_slug, created_at DESC) — not full table scan at 81 rows",
              store_visits:
                "Should use idx_store_visits_tenant_completed (tenant_slug, completed_at DESC)",
              bottleneckHypothesis:
                "709ms likely RPC round-trip + multiple aggregations on 2500-row CTE + parallel guest insights + top_menus RPC, not missing index at current scale",
            },
          },
        },
        null,
        2,
      ),
    );
    return;
  }

  let pg;
  try {
    pg = await import("pg");
  } catch {
    console.log(JSON.stringify({ ok: false, reason: "npm package pg not installed — run npm i -D pg" }, null, 2));
    process.exit(1);
  }

  const client = new pg.default.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const results = [];
  for (const q of QUERIES) {
    const t0 = performance.now();
    const res = await client.query(q.sql);
    const elapsedMs = Math.round(performance.now() - t0);
    const plan = res.rows.map((r) => r["QUERY PLAN"] || Object.values(r)[0]).join("\n");
    const usesSeqScan = /Seq Scan on orders/i.test(plan);
    const usesIndex = /Index Scan|Index Only Scan|Bitmap Index Scan/i.test(plan);
    results.push({
      name: q.name,
      elapsedMs,
      usesSeqScanOnOrders: usesSeqScan,
      usesIndexScan: usesIndex,
      plan,
    });
  }

  await client.end();
  console.log(JSON.stringify({ ok: true, tenant, since, until, results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
