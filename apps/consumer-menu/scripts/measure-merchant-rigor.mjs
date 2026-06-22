#!/usr/bin/env node
/**
 * 점주앱 성능 재측정 (Claude 피드백 반영)
 * - 20+ 샘플, median + p95
 * - MERCHANT_PERF_EMAIL/PASSWORD 로그인 후 E2E 탭 전환 (클릭→렌더)
 * - 탭 전환 시 네트워크 바이트 (Playwright)
 * - 프로덕션 /live/* HTTP 타이밍 (인증 없음 = auth-only 경계)
 *
 * Usage:
 *   MERCHANT_PERF_EMAIL=... MERCHANT_PERF_PASSWORD=... node scripts/measure-merchant-rigor.mjs [tenant] [baseUrl]
 *   RUNS=25 node scripts/measure-merchant-rigor.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import { execSync } from "node:child_process";
import os from "node:os";

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
    if (val && process.env[key] == null) process.env[key] = val;
  }
}

for (const p of [
  resolve(root, ".env.local"),
  resolve(root, ".env.production.local"),
  resolve(root, ".env.vercel-prod-cm"),
]) {
  loadEnv(p);
}

const RUNS = Math.max(20, Number(process.env.PERF_RUNS) || 25);
const baseUrl = (process.argv[3] || process.env.BENCH_BASE_URL || "https://chaya-app.vercel.app").replace(/\/$/, "");
const tenant = process.argv[2] || process.env.BENCH_TENANT || "demo";
const perfEmail = process.env.MERCHANT_PERF_EMAIL?.trim() || "";
const perfPassword = process.env.MERCHANT_PERF_PASSWORD?.trim() || "";

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function stats(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return {
    n: sorted.length,
    min: sorted[0] ?? null,
    median,
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1] ?? null,
    samples: sorted,
  };
}

async function loadPlaywright() {
  try {
    const mod = await import("playwright");
    return mod.chromium ? mod : mod.default;
  } catch {
    const fallback = process.env.PLAYWRIGHT_MODULE_ROOT;
    if (fallback) {
      const loaded = await import(pathToFileURL(resolve(fallback, "playwright/index.js")).href);
      return loaded.chromium ? loaded : loaded.default;
    }
    throw new Error("playwright not installed — set PLAYWRIGHT_MODULE_ROOT or npm i -D playwright");
  }
}

async function timeHttp(label, url, headers = {}) {
  const ms = [];
  let last = { status: 0, bytes: 0, ttfbMs: null };
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    const res = await fetch(url, { headers, redirect: "manual" });
    const ttfbMs = Math.round(performance.now() - t0);
    const buf = await res.arrayBuffer();
    ms.push(Math.round(performance.now() - t0));
    last = { status: res.status, bytes: buf.byteLength, ttfbMs };
  }
  return { label, url, ...stats(ms), ...last };
}

async function measureHttpEndpoints() {
  const tEnc = encodeURIComponent(tenant);
  const targets = [
    ["ssr_login", `${baseUrl}/m/login`],
    ["ssr_dashboard_unauth", `${baseUrl}/m/${tEnc}/dashboard`],
    ["live_dashboard_401", `${baseUrl}/m/${tEnc}/live/dashboard`],
    ["live_orders_401", `${baseUrl}/m/${tEnc}/live/orders?tab=all`],
    ["live_menus_401", `${baseUrl}/m/${tEnc}/live/menus`],
    ["live_analytics_401", `${baseUrl}/m/${tEnc}/live/analytics?days=7`],
    ["live_guests_401", `${baseUrl}/m/${tEnc}/live/guests?days=7`],
    ["live_summary_401", `${baseUrl}/m/${tEnc}/live/summary`],
  ];
  const out = [];
  for (const [label, url] of targets) out.push(await timeHttp(label, url));
  return out;
}

function readBuildFirstLoadJs() {
  try {
    const out = execSync("npm run build 2>&1", {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      env: { ...process.env, CI: "1" },
    });
    const routes = {};
    for (const line of out.split("\n")) {
      const m = line.match(/^\s*(├|└)\s+\/m\/\[tenant\]\/(dashboard|orders|menus|analytics)\s+([\d.]+\s*kB)\s+([\d.]+\s*kB)/);
      if (m) routes[m[2]] = { route: m[3].trim(), firstLoad: m[4].trim() };
      const shared = line.match(/\+ First Load JS shared by all\s+([\d.]+\s*kB)/);
      if (shared) routes._sharedFirstLoad = shared[1].trim();
    }
    return { ok: true, routes };
  } catch (e) {
    return { ok: false, error: String(e.message || e).slice(0, 200) };
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
    await page.waitForURL(`**/${tenant}/dashboard**`, { timeout: 45_000 });
    await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 30_000 });
    return true;
  } catch {
    return false;
  }
}

function bottomTab(page, label) {
  return page.locator('nav[aria-label="점주 하단 메뉴"]').getByRole("link", { name: label, exact: true });
}

async function measureTabTransition(page, clickFn, waitSelector, label, resetFn) {
  const wallMs = [];
  const networkBytes = [];
  const apiMs = [];
  const newJsChunks = [];

  for (let i = 0; i < RUNS; i++) {
    if (resetFn) await resetFn();
    const pending = [];
    const onReq = (req) => {
      pending.push({ url: req.url(), method: req.method(), t0: performance.now() });
    };
    const onDone = async (req) => {
      const p = pending.find((x) => x.url === req.url());
      try {
        const res = await req.response();
        const timing = { url: req.url(), method: req.method(), status: res?.status() ?? 0 };
        if (req.url().includes("/live/")) {
          apiMs.push(Math.round(performance.now() - (p?.t0 ?? performance.now())));
        }
        if (req.url().includes("/_next/static") && req.url().endsWith(".js")) {
          const body = await res?.body().catch(() => null);
          const bytes = body?.length ?? 0;
          if (bytes > 0) newJsChunks.push({ url: req.url(), bytes });
        }
      } catch {
        /* ignore */
      }
    };
    page.on("request", onReq);
    page.on("requestfinished", onDone);

    let transferDuring = 0;
    const onResponse = async (res) => {
      try {
        const req = res.request();
        const body = await res.body().catch(() => null);
        transferDuring += body?.length ?? 0;
      } catch {
        /* ignore */
      }
    };
    page.on("response", onResponse);

    const t0 = performance.now();
    await clickFn();
    try {
      await page.waitForSelector(waitSelector, { state: "visible", timeout: 45_000 });
    } catch {
      const alts = waitSelector.split(",").map((s) => s.trim());
      let ok = false;
      for (const sel of alts) {
        try {
          await page.waitForSelector(sel, { state: "visible", timeout: 8_000 });
          ok = true;
          break;
        } catch {
          /* try next */
        }
      }
      if (!ok) throw new Error(`timeout waiting for ${label}: ${waitSelector}`);
    }
    await page.evaluate(() =>
      new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    wallMs.push(Math.round(performance.now() - t0));
    networkBytes.push(transferDuring);

    page.removeListener("request", onReq);
    page.removeListener("requestfinished", onDone);
    page.removeListener("response", onResponse);

    await page.waitForTimeout(120);
  }

  const uniqueNewJs = [...new Map(newJsChunks.map((c) => [c.url, c])).values()];
  return {
    label,
    e2e: stats(wallMs),
    networkTransferBytes: stats(networkBytes),
    liveApiDuringTransition: apiMs.length ? stats(apiMs) : null,
    newJsChunksLoaded: uniqueNewJs,
    newJsTotalBytes: uniqueNewJs.reduce((s, c) => s + c.bytes, 0),
  };
}

async function waitAnalyticsReady(page, timeoutMs = 120_000) {
  await page.waitForURL("**/analytics**", { timeout: 20_000 });
  await page.waitForSelector('[aria-label="분석 기간 선택"]', {
    state: "visible",
    timeout: 60_000,
  });
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await page.locator('[aria-label="기간 요약"]').isVisible()) return;
    if (await page.locator('[role="alert"]').first().isVisible()) return;
    await page.waitForTimeout(200);
  }
  throw new Error("analytics data timeout");
}

async function measureAuthenticatedE2E() {
  if (!perfEmail || !perfPassword) {
    return { ok: false, reason: "MERCHANT_PERF_EMAIL/PASSWORD not set" };
  }

  const pw = await loadPlaywright();
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
  });
  const page = await context.newPage();

  const loggedIn = await loginViaForm(page);
  if (!loggedIn) {
    await browser.close();
    return { ok: false, reason: "login failed — check MERCHANT_PERF credentials" };
  }

  await bottomTab(page, "홈").click();
  await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 20_000 });
  await page.waitForTimeout(400);

  // 분석 탭 첫 마운트·API warm-up (SPA visited set)
  await bottomTab(page, "분석").click();
  await waitAnalyticsReady(page);
  await bottomTab(page, "홈").click();
  await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 20_000 });

  const goHome = async () => {
    await bottomTab(page, "홈").click();
    await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 20_000 });
    await page.waitForTimeout(150);
  };
  const goOrders = async () => {
    await bottomTab(page, "주문").click();
    await page.waitForSelector('[aria-label="주문 구분"]', { timeout: 20_000 });
    await page.waitForTimeout(150);
  };
  const goMenus = async () => {
    await bottomTab(page, "메뉴").click();
    await page.waitForSelector('nav[aria-label="메뉴 필터"]', { timeout: 20_000 });
    await page.waitForTimeout(150);
  };
  const closeOverlayIfOpen = async () => {
    const close = page.getByRole("button", { name: "닫기" });
    if (await close.isVisible().catch(() => false)) {
      await close.click();
      await page.waitForTimeout(150);
    }
  };
  const goDashboardForHeader = async () => {
    await closeOverlayIfOpen();
    if (!page.url().includes("/dashboard")) {
      await page.goto(`${baseUrl}/m/${encodeURIComponent(tenant)}/dashboard`, {
        waitUntil: "domcontentloaded",
      });
    }
    await page.waitForSelector('[aria-label="오늘 매출"]', { timeout: 20_000 });
    await page.waitForTimeout(150);
  };

  const transitions = [];
  transitions.push(
    await measureTabTransition(
      page,
      () => bottomTab(page, "주문").click(),
      '[aria-label="주문 구분"]',
      "home_to_orders",
      goHome,
    ),
  );
  transitions.push(
    await measureTabTransition(
      page,
      () => bottomTab(page, "메뉴").click(),
      'nav[aria-label="메뉴 필터"]',
      "orders_to_menus",
      goOrders,
    ),
  );
  transitions.push(
    await measureTabTransition(
      page,
      async () => {
        await bottomTab(page, "분석").click();
        await waitAnalyticsReady(page);
      },
      '[aria-label="기간 요약"]',
      "menus_to_analytics",
      goMenus,
    ),
  );

  transitions.push(
    await measureTabTransition(
      page,
      () => page.getByRole("button", { name: /^공지사항/ }).click(),
      'nav[aria-label="공지 유형"]',
      "to_announcements_overlay",
      goDashboardForHeader,
    ),
  );

  transitions.push(
    await measureTabTransition(
      page,
      () => page.getByRole("button", { name: "더보기", exact: true }).click(),
      '[role="dialog"][aria-label="더보기"] >> text=매장 정보',
      "to_more_overlay",
      goDashboardForHeader,
    ),
  );

  await browser.close();
  return { ok: true, transitions };
}

async function measureColdWarmLogin() {
  const pw = await loadPlaywright();
  const coldHydration = [];
  const warmHydration = [];

  for (let i = 0; i < RUNS; i++) {
    const browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    const t0 = performance.now();
    await page.goto(`${baseUrl}/m/login`, { waitUntil: "commit", timeout: 60_000 });
    await page.waitForSelector("#m-email", { state: "visible", timeout: 30_000 });
    coldHydration.push(Math.round(performance.now() - t0));
    await browser.close();
  }

  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`${baseUrl}/m/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#m-email");
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector("#m-email", { state: "visible", timeout: 30_000 });
    warmHydration.push(Math.round(performance.now() - t0));
  }
  await browser.close();

  return {
    coldLoginCommitToInteractive: stats(coldHydration),
    warmLoginReloadToInteractive: stats(warmHydration),
  };
}

async function main() {
  const networkEnv = {
    host: os.hostname(),
    platform: `${os.platform()} ${os.release()}`,
    nodeRegion: process.env.VERCEL_REGION || "local (not Vercel runtime)",
    playwrightThrottling: "none (default Chromium, no CDP network throttling)",
    targetCdn: "Vercel (chaya-app.vercel.app, edge region varies by request)",
    supabaseDbRegion: "ap-northeast-2 (Seoul) per linked project",
    note: "Measurements from developer machine unless MERCHANT_PERF run on CI",
  };

  console.error(`[rigor] HTTP ${RUNS}-run sampling…`);
  const http = process.env.PERF_SKIP_HTTP === "1" ? null : await measureHttpEndpoints();

  console.error(`[rigor] Playwright cold/warm login ${RUNS}-run…`);
  let loginTiming = null;
  if (process.env.PERF_SKIP_LOGIN === "1") {
    loginTiming = { skipped: true };
  } else {
    try {
      loginTiming = await measureColdWarmLogin();
    } catch (e) {
      loginTiming = { error: String(e.message || e) };
    }
  }

  console.error(`[rigor] Authenticated E2E tab transitions…`);
  const e2e = await measureAuthenticatedE2E();

  const report = {
    measuredAt: new Date().toISOString(),
    networkEnvironment: networkEnv,
    config: { baseUrl, tenant, runs: RUNS, hasMerchantPerfCredentials: Boolean(perfEmail && perfPassword) },
    httpEndpoints: http,
    loginPageTiming: loginTiming,
    authenticatedTabTransitions: e2e,
    trustedBaselineFromPriorSession: {
      analyticsSupabaseMs: 709,
      note: "Re-validate with authenticated /live/analytics when credentials available",
    },
    buildBundles: { skipped: true, reason: "Run npm run build separately to avoid long script time" },
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
