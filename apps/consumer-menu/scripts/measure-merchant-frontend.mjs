#!/usr/bin/env node
/**
 * 점주앱 프론트엔드 실측 (Playwright + 선택적 로그인)
 * Usage:
 *   MERCHANT_PERF_EMAIL=... MERCHANT_PERF_PASSWORD=... node scripts/measure-merchant-frontend.mjs [tenant]
 *   PLAYWRIGHT_MODULE_ROOT=C:/path/to/node_modules node scripts/measure-merchant-frontend.mjs
 */
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i);
    let val = t.slice(i + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val && !process.env[key]) process.env[key] = val;
  }
}

for (const p of [
  resolve(process.cwd(), ".env.production.local"),
  resolve(process.cwd(), ".env.local"),
  resolve(root, ".env.production.local"),
  resolve(root, ".env.local"),
]) {
  loadEnv(p);
}

const baseUrl = (process.argv[3] || process.env.BENCH_BASE_URL || "https://chaya-app.vercel.app").replace(/\/$/, "");
const tenant = process.argv[2] || process.env.BENCH_TENANT || "demo";
const perfEmail = process.env.MERCHANT_PERF_EMAIL?.trim() || "";
const perfPassword = process.env.MERCHANT_PERF_PASSWORD?.trim() || "";

function median(nums) {
  const a = [...nums].sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : Math.round((a[m - 1] + a[m]) / 2);
}

async function loadPlaywright() {
  try {
    const mod = await import("playwright");
    return mod.default ?? mod;
  } catch {
    const fallback = process.env.PLAYWRIGHT_MODULE_ROOT;
    if (fallback) {
      const mod = pathToFileURL(resolve(fallback, "playwright/index.js")).href;
      const loaded = await import(mod);
      return loaded.default ?? loaded;
    }
    throw new Error("playwright not installed");
  }
}

async function resolveMerchantEmail(slug) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;
  const memRes = await fetch(
    `${url}/rest/v1/merchant_tenant_members?select=user_id&tenant_slug=eq.${encodeURIComponent(slug)}&approved_at=not.is.null&limit=1`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  const members = await memRes.json();
  const userId = members?.[0]?.user_id;
  if (!userId) return null;
  const userRes = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!userRes.ok) return null;
  const user = await userRes.json();
  return user?.email ?? null;
}

async function createMagicLinkSession(email) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const res = await fetch(`${url}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "magiclink",
      email,
      options: { redirect_to: `${baseUrl}/m/auth/confirm` },
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.action_link ?? null;
}

async function loginViaMagicLink(page) {
  const email = await resolveMerchantEmail(tenant);
  if (!email) return false;
  const link = await createMagicLinkSession(email);
  if (!link) return false;
  await page.goto(link, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1200);
  await page.goto(`${baseUrl}/m/${encodeURIComponent(tenant)}/dashboard`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  try {
    await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

async function loginViaForm(page) {
  if (!perfEmail || !perfPassword) return false;
  await page.goto(`${baseUrl}/m/login?next=${encodeURIComponent(`/m/${tenant}/dashboard`)}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  await page.fill("#m-email", perfEmail);
  await page.fill("#m-password", perfPassword);
  await page.getByRole("button", { name: "로그인" }).click();
  try {
    await page.waitForURL(`**/${tenant}/dashboard**`, { timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

async function collectResourceMetrics(page) {
  return page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const t0 = nav?.startTime ?? 0;
    const scripts = performance
      .getEntriesByType("resource")
      .filter((e) => e.name.includes("/_next/static") && /\.js(\?|$)/.test(e.name));
    const jsDownloadEnd = scripts.length ? Math.max(...scripts.map((s) => s.responseEnd)) : 0;
    return {
      jsDownloadMs: Math.round(jsDownloadEnd - t0),
      jsTransferBytes: scripts.reduce((a, s) => a + (s.transferSize || 0), 0),
      jsEncodedBytes: scripts.reduce((a, s) => a + (s.encodedBodySize || 0), 0),
      jsChunkCount: scripts.length,
      ttfbMs: nav ? Math.round(nav.responseStart - t0) : null,
      domInteractiveMs: nav ? Math.round(nav.domInteractive - t0) : null,
      domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd - t0) : null,
      loadEventMs: nav ? Math.round(nav.loadEventEnd - t0) : null,
    };
  });
}

async function waitHydrationMarker(page, selector, timeout = 60_000) {
  const t0 = performance.now();
  await page.waitForSelector(selector, { state: "visible", timeout });
  await page.evaluate(() =>
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
  );
  const markerMs = Math.round(performance.now() - t0);
  const navBased = await page.evaluate((sel) => {
    const nav = performance.getEntriesByType("navigation")[0];
    const t0n = nav?.startTime ?? 0;
    const scripts = performance
      .getEntriesByType("resource")
      .filter((e) => e.name.includes("/_next/static") && /\.js(\?|$)/.test(e.name));
    const jsEnd = scripts.length ? Math.max(...scripts.map((s) => s.responseEnd)) : 0;
    const has = !!document.querySelector(sel);
    return {
      hydrationFromNavMs: has ? Math.round(performance.now() - t0n) : null,
      jsDownloadFromNavMs: Math.round(jsEnd - t0n),
    };
  }, selector);
  return { markerMs, ...navBased };
}

async function measureTransition(page, action, waitSelector, label) {
  const samples = [];
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => performance.mark("tx-start"));
    const wall0 = performance.now();
    await action();
    await page.waitForSelector(waitSelector, { state: "visible", timeout: 30_000 });
    await page.evaluate(() =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    const wallMs = Math.round(performance.now() - wall0);
    const longTaskMs = await page.evaluate(() => {
      const start = performance.getEntriesByName("tx-start")[0]?.startTime ?? 0;
      return Math.round(
        performance
          .getEntriesByType("longtask")
          .filter((t) => t.startTime >= start)
          .reduce((s, t) => s + t.duration, 0),
      );
    });
    samples.push({ wallMs, longTaskMs });
    await page.waitForTimeout(350);
  }
  return {
    label,
    medianMs: median(samples.map((s) => s.wallMs)),
    samplesMs: samples.map((s) => s.wallMs),
    medianLongTaskMs: median(samples.map((s) => s.longTaskMs)),
  };
}

function walkJs(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walkJs(p, acc);
    else if (name.endsWith(".js")) acc.push({ path: p, bytes: st.size });
  }
  return acc;
}

function localBuildBundleStats() {
  const staticDir = resolve(root, ".next/static/chunks");
  const files = walkJs(staticDir).sort((a, b) => b.bytes - a.bytes);
  const total = files.reduce((s, f) => s + f.bytes, 0);
  return {
    totalEncodedKB: Math.round(total / 1024),
    topChunks: files.slice(0, 10).map((f) => ({
      file: f.path.split(".next/static/chunks/")[1],
      encodedKB: Math.round(f.bytes / 1024),
    })),
  };
}

async function fetchScriptInventoryFromHtml(url) {
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  const re = /\/_next\/static\/chunks\/[^"'\s]+\.js/g;
  const urls = [...new Set(html.match(re) ?? [])];
  let totalBytes = 0;
  let maxEnd = 0;
  const chunks = [];
  for (const u of urls) {
    const t0 = performance.now();
    const r = await fetch(`${baseUrl}${u}`);
    const buf = await r.arrayBuffer();
    const ms = Math.round(performance.now() - t0);
    totalBytes += buf.byteLength;
    maxEnd = Math.max(maxEnd, ms);
    chunks.push({ file: u.split("/").pop(), bytes: buf.byteLength, downloadMs: ms });
  }
  chunks.sort((a, b) => b.bytes - a.bytes);
  return {
    url,
    scriptCount: urls.length,
    totalEncodedKB: Math.round(totalBytes / 1024),
    sequentialDownloadMs: maxEnd,
    topChunks: chunks.slice(0, 8),
  };
}

async function main() {
  const { chromium } = await loadPlaywright();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
  });
  const page = await context.newPage();

  const authenticated =
    (await loginViaForm(page)) || (await loginViaMagicLink(page));
  const mode = authenticated ? "authenticated" : "login_fallback";

  let firstLoad = {};
  let hydration = {};
  let transitions = [];
  let bundles = { topChunks: [] };

  if (authenticated) {
    await page.goto(`${baseUrl}/m/${encodeURIComponent(tenant)}/dashboard`, {
      waitUntil: "commit",
      timeout: 60_000,
    });
    hydration = await waitHydrationMarker(page, '[aria-label="오늘 매출"]');
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    firstLoad = await collectResourceMetrics(page);
    bundles = await page.evaluate(() => {
      const scripts = performance
        .getEntriesByType("resource")
        .filter((e) => e.name.includes("/_next/static") && /\.js(\?|$)/.test(e.name))
        .map((e) => ({
          url: e.name.split("/").pop()?.slice(0, 48) ?? e.name,
          transferBytes: e.transferSize || 0,
          durationMs: Math.round(e.duration),
        }))
        .sort((a, b) => b.transferBytes - a.transferBytes);
      return { totalTransferBytes: scripts.reduce((s, x) => s + x.transferBytes, 0), topChunks: scripts.slice(0, 12) };
    });

    await page.getByRole("link", { name: "홈" }).click();
    await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 15_000 });
    await page.waitForTimeout(400);

    transitions.push(
      await measureTransition(
        page,
        () => page.getByRole("link", { name: "주문" }).click(),
        '[aria-label="주문 구분"]',
        "home_to_orders",
      ),
    );
    transitions.push(
      await measureTransition(
        page,
        () => page.getByRole("link", { name: "메뉴" }).click(),
        'nav[aria-label="메뉴 필터"]',
        "orders_to_menus",
      ),
    );
    transitions.push(
      await measureTransition(
        page,
        () => page.getByRole("link", { name: "분석" }).click(),
        'nav[aria-label="분석 기간 선택"]',
        "menus_to_analytics",
      ),
    );
    await page.getByRole("link", { name: "홈" }).click();
    await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 15_000 });
    transitions.push(
      await measureTransition(
        page,
        () => page.getByRole("link", { name: /^공지사항/ }).click(),
        'nav[aria-label="공지 유형"]',
        "announcements",
      ),
    );
    await page.goto(`${baseUrl}/m/${encodeURIComponent(tenant)}/dashboard`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 30_000 });
    transitions.push(
      await measureTransition(
        page,
        () => page.getByRole("link", { name: "더보기" }).click(),
        "text=매장 정보",
        "hamburger_more",
      ),
    );
  } else {
    await page.goto(`${baseUrl}/m/login`, { waitUntil: "commit", timeout: 60_000 });
    hydration = await waitHydrationMarker(page, "#m-email");
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    firstLoad = await collectResourceMetrics(page);
  }

  await browser.close();

  const loginScripts = await fetchScriptInventoryFromHtml(`${baseUrl}/m/login`);
  const buildStats = localBuildBundleStats();

  const bottlenecks = [];
  bottlenecks.push({
    rank: 1,
    area: "초기 JS 다운로드 (navigation 기준)",
    ms: firstLoad.jsDownloadMs ?? hydration.jsDownloadFromNavMs,
    detail: `${Math.round((firstLoad.jsTransferBytes || 0) / 1024)}KB transfer · ${firstLoad.jsChunkCount ?? "?"} chunks · mode=${mode}`,
  });
  bottlenecks.push({
    rank: 2,
    area: "Hydration → interactive UI",
    ms: hydration.hydrationFromNavMs ?? hydration.markerMs,
    detail: `DOM interactive ${firstLoad.domInteractiveMs ?? "?"}ms · DCL ${firstLoad.domContentLoadedMs ?? "?"}ms`,
  });
  bottlenecks.push({
    rank: 3,
    area: "TTFB (SSR HTML)",
    ms: firstLoad.ttfbMs,
    detail: `load event ${firstLoad.loadEventMs ?? "?"}ms`,
  });
  if (transitions.length) {
    const sorted = [...transitions].sort((a, b) => b.medianMs - a.medianMs);
    bottlenecks.push({
      rank: 4,
      area: `탭/화면 전환 — ${sorted[0].label}`,
      ms: sorted[0].medianMs,
      detail: `samples ${sorted[0].samplesMs.join(", ")}ms · longtask ${sorted[0].medianLongTaskMs}ms`,
    });
    bottlenecks.push({
      rank: 5,
      area: `탭/화면 전환 — ${sorted[1]?.label ?? "n/a"}`,
      ms: sorted[1]?.medianMs ?? null,
      detail: sorted[1] ? `samples ${sorted[1].samplesMs.join(", ")}ms` : "n/a",
    });
  } else {
    const top = loginScripts.topChunks[0];
    bottlenecks.push({
      rank: 4,
      area: "로그인 HTML script chunk (최대)",
      ms: top?.downloadMs,
      detail: top ? `${top.file} · ${Math.round(top.bytes / 1024)}KB` : "n/a",
    });
    bottlenecks.push({
      rank: 5,
      area: "로컬 빌드 JS 총량 (encoded)",
      ms: null,
      detail: `${buildStats.totalEncodedKB}KB · top ${buildStats.topChunks[0]?.file ?? "?"} ${buildStats.topChunks[0]?.encodedKB ?? "?"}KB`,
    });
  }

  const report = {
    measuredAt: new Date().toISOString(),
    target: { baseUrl, tenant, viewport: "390x844", mode },
    note:
      mode === "login_fallback"
        ? "MERCHANT_PERF_EMAIL/PASSWORD 미설정 — 로그인 화면 기준 측정. 탭 전환은 인증 필요."
        : "점주 로그인 후 실측",
    metrics: {
      "1_js_download_ms": firstLoad.jsDownloadMs ?? hydration.jsDownloadFromNavMs,
      "1_js_transfer_kb": Math.round((firstLoad.jsTransferBytes || 0) / 1024),
      "1_js_chunk_count": firstLoad.jsChunkCount,
      "2_hydration_ms": hydration.hydrationFromNavMs ?? hydration.markerMs,
      "3_home_to_orders_ms": transitions.find((t) => t.label === "home_to_orders")?.medianMs ?? null,
      "4_orders_to_menus_ms": transitions.find((t) => t.label === "orders_to_menus")?.medianMs ?? null,
      "5_menus_to_analytics_ms": transitions.find((t) => t.label === "menus_to_analytics")?.medianMs ?? null,
      "6_announcements_ms": transitions.find((t) => t.label === "announcements")?.medianMs ?? null,
      "7_hamburger_more_ms": transitions.find((t) => t.label === "hamburger_more")?.medianMs ?? null,
    },
    transitions: Object.fromEntries(transitions.map((t) => [t.label, t])),
    loginPageScripts: loginScripts,
    localBuildBundles: buildStats,
    runtimeJsTopChunks: bundles.topChunks?.slice(0, 8) ?? [],
    topBottlenecks: bottlenecks,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
