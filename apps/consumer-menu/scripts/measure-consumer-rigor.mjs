#!/usr/bin/env node
/**
 * 소비자앱 QR→메뉴 critical path 측정 (콜드 스타트, 네트워크 쓰로틀링)
 *
 * - Playwright Chromium 390×844
 * - Fast 3G + Slow 4G (Chrome DevTools 프리셋)
 * - 매 샘플: 새 browser context (캐시·localStorage 없음)
 * - 25+ 샘플 median + p95
 *
 * Usage:
 *   node scripts/measure-consumer-rigor.mjs [tenant] [baseUrl]
 *   PERF_RUNS=25 node scripts/measure-consumer-rigor.mjs demo
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";
import os from "node:os";

import {
  CONSUMER_THROTTLE_PROFILES,
  PILOT_PRIMARY_PROFILE_KEYS,
  REGRESSION_GUARD_PROFILE_KEYS,
} from "./consumer-throttle-profiles.mjs";

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
const menuUrl = `${baseUrl}/t/${encodeURIComponent(tenant)}`;

/** @deprecated use CONSUMER_THROTTLE_PROFILES — all profiles measured each run */
const THROTTLE_PROFILES = CONSUMER_THROTTLE_PROFILES;

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
}

function stats(nums) {
  const filtered = nums.filter((n) => Number.isFinite(n));
  const sorted = [...filtered].sort((a, b) => a - b);
  if (!sorted.length) return { n: 0, min: null, median: null, p95: null, max: null };
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  return {
    n: sorted.length,
    min: sorted[0],
    median,
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
  };
}

async function loadPlaywright() {
  try {
    const mod = await import("playwright");
    return mod.chromium ? mod : mod.default;
  } catch {
    throw new Error("playwright not installed — corepack pnpm add -D playwright --filter consumer-menu");
  }
}

async function applyThrottle(page, profile) {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: profile.downloadThroughput,
    uploadThroughput: profile.uploadThroughput,
    latency: profile.latency,
  });
}

async function measureColdQrToMenu(pw, profile) {
  const ttfbMs = [];
  const menuTextMs = [];
  const firstImageMs = [];
  const interactiveMs = [];
  const experiencePostMs = []; // ms after navigation start; null if none
  const experiencePostDuration = [];
  const guestSessionAfterTextMs = [];
  const imageRequestCount = [];
  const jsBytes = [];
  const categorySwitchMs = [];

  for (let i = 0; i < RUNS; i++) {
    const browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      locale: "ko-KR",
    });
    const page = await context.newPage();
    await applyThrottle(page, profile);

    const navStart = performance.now();
    let docTtfb = null;
    const reqLog = [];
    let sampleOk = true;

    page.on("request", (req) => {
      reqLog.push({ url: req.url(), method: req.method(), t: performance.now() - navStart, type: req.resourceType() });
    });

    page.on("response", async (res) => {
      try {
        const req = res.request();
        const url = req.url();
        if (req.method() === "GET" && url.startsWith(menuUrl.split("?")[0]) && docTtfb == null) {
          docTtfb = Math.round(performance.now() - navStart);
        }
        if (req.method() === "POST" && url.includes(`/t/${tenant}`)) {
          const t0 = performance.now();
          await res.body().catch(() => null);
          experiencePostDuration.push(Math.round(performance.now() - t0));
        }
      } catch {
        /* ignore */
      }
    });

    try {
      await page.goto(menuUrl, { waitUntil: "domcontentloaded", timeout: 180_000 });

      if (docTtfb == null) {
        docTtfb = Math.round(performance.now() - navStart);
      }
      ttfbMs.push(docTtfb);

      try {
        await page.waitForSelector("#main-content h3", { state: "visible", timeout: 120_000 });
      } catch {
        await page.waitForSelector("#main-content", { state: "attached", timeout: 120_000 });
      }
      const textAt = Math.round(performance.now() - navStart);
      menuTextMs.push(textAt);

      const guestTiming = await page.evaluate(() => {
        const key = "chaya_guest_session";
        const has = Boolean(localStorage.getItem(key));
        return { hasGuestSession: has };
      });
      guestSessionAfterTextMs.push(guestTiming.hasGuestSession ? 0 : null);

      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      interactiveMs.push(Math.round(performance.now() - navStart));

      const posts = reqLog.filter((r) => r.method === "POST" && r.url.includes(`/t/${encodeURIComponent(tenant)}`));
      if (posts.length > 0) {
        experiencePostMs.push(Math.round(posts[0].t));
      }

      const imgs = await page.evaluate(() => {
        const nodes = [...document.querySelectorAll("#main-content img[src]")];
        return nodes.length;
      });
      imageRequestCount.push(imgs);

      let firstImgAt = null;
      try {
        await page.waitForFunction(
          () => {
            const img = document.querySelector("#main-content img[src]");
            return img && img.complete && img.naturalWidth > 0;
          },
          { timeout: 90_000 },
        );
        firstImgAt = Math.round(performance.now() - navStart);
      } catch {
        firstImgAt = null;
      }
      firstImageMs.push(firstImgAt);

      const jsLoaded = reqLog.filter((r) => r.url.includes("/_next/static") && r.url.endsWith(".js")).length;
      jsBytes.push(jsLoaded);

      const chipCount = await page.locator("#main-content nav[aria-label] button").count();
      if (chipCount >= 2) {
        const t0 = performance.now();
        await page.locator("#main-content nav[aria-label] button").nth(1).click();
        await page.waitForTimeout(100);
        categorySwitchMs.push(Math.round(performance.now() - t0));
      }
    } catch (e) {
      sampleOk = false;
      console.error(`[consumer-rigor] sample ${i + 1}/${RUNS} (${profile.label}) failed: ${e.message ?? e}`);
    } finally {
      await browser.close();
    }

    if (!sampleOk) {
      /* failed sample omitted from stats arrays */
    }
  }

  return {
    profile: profile.label,
    coldQrToMenu: {
      documentTtfb: stats(ttfbMs),
      menuTextVisible: stats(menuTextMs),
      interactivePaint: stats(interactiveMs),
      firstMenuImageVisible: stats(firstImageMs.filter((x) => x != null)),
      firstMenuImageMissingSamples: firstImageMs.filter((x) => x == null).length,
    },
    sideEffects: {
      guestSessionBeforeMenuText: {
        note: "localStorage UUID — useEffect, non-blocking SSR",
        samplesWithSessionAtTextPaint: guestSessionAfterTextMs.filter((x) => x === 0).length,
        total: guestSessionAfterTextMs.length,
      },
      experienceEventPost: {
        note: "trackExperienceEvent server action — fire-and-forget void, after paint",
        relativeToNavStartMs: stats(experiencePostMs),
        postResponseMs: stats(experiencePostDuration),
        samplesWithPost: experiencePostMs.length,
      },
      menuImageCountAtText: stats(imageRequestCount),
      jsChunkRequests: stats(jsBytes),
    },
    categoryChipSwitch: categorySwitchMs.length ? stats(categorySwitchMs) : { n: 0, note: "single category — skipped" },
  };
}

async function measureHttpTtfb() {
  const fast = [];
  const slow = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    const res = await fetch(menuUrl, { redirect: "follow" });
    await res.arrayBuffer();
    fast.push(Math.round(performance.now() - t0));
  }
  return {
    label: "fetch_full_document_no_throttle",
    note: "Node fetch from measurer PC — not Playwright; includes full HTML download",
    ...stats(fast),
    statusNote: "실측 (측정 PC 네트워크, 쓰로틀링 없음)",
  };
}

async function main() {
  console.error(`[consumer-rigor] tenant=${tenant} url=${menuUrl} runs=${RUNS}`);

  const pw = await loadPlaywright();
  const byProfile = {};

  for (const [key, profile] of Object.entries(THROTTLE_PROFILES)) {
    console.error(`[consumer-rigor] Playwright cold QR→menu (${profile.label}) ${RUNS}-run…`);
    byProfile[key] = await measureColdQrToMenu(pw, profile);
  }

  console.error(`[consumer-rigor] HTTP document fetch (no throttle) ${RUNS}-run…`);
  const httpDoc = await measureHttpTtfb();

  const report = {
    measuredAt: new Date().toISOString(),
    networkEnvironment: {
      host: os.hostname(),
      platform: `${os.platform()} ${os.release()}`,
      playwrightThrottling: "CDP Network.emulateNetworkConditions per sample",
      profiles: CONSUMER_THROTTLE_PROFILES,
      pilotPrimaryProfileKeys: PILOT_PRIMARY_PROFILE_KEYS,
      regressionGuardProfileKeys: REGRESSION_GUARD_PROFILE_KEYS,
      kpiNote: "파일럿 KPI = koreaLte·storeWifi median. fast3g = 회귀 가드만.",
      target: baseUrl,
      supabaseDbRegion: "ap-northeast-2 (Seoul) — run explain-consumer-menus.sql separately",
      note: "소비자는 콜드 스타트가 기본 — 매 샘플 새 context, storage 비움",
    },
    config: { baseUrl, tenant, menuUrl, runs: RUNS },
    architectureNotes: {
      guestSession: "GuestSessionInit useEffect → localStorage UUID (렌더 비차단)",
      qrScanEvent: "ExperienceTrackQrScan useEffect → trackExperienceEvent server action (void, 비차단)",
      menuData: "listMenusForTenantBoard SSR on page + unstable_cache 60s",
      images: "/menu-thumb WebP proxy (~128px), SSR list eager top-2, MenuLazyImage lazy+priority rows",
      pageCache: "revalidate removed — locale via ?lang+cookie; menu data unstable_cache 60s",
    },
    httpDocumentFetch: httpDoc,
    playwrightColdPath: byProfile,
    top3BottleneckHypothesis: {
      note: "아래는 스크립트 실행 후 JSON의 median으로 갱신 — EXPLAIN 결과와 함께 해석",
      candidates: ["document TTFB + SSR", "JS download/hydration (쓰로틀)", "menu images (lazy, 첫 이미지)"],
    },
  };

  // Top 3 from pilot primary (koreaLte) medians
  const pilot = byProfile.koreaLte?.coldQrToMenu;
  if (pilot) {
    const ranked = [
      { label: "document_ttfb", ms: pilot.documentTtfb.median, cause: "network+SSR" },
      { label: "menu_text_visible", ms: pilot.menuTextVisible.median, cause: "SSR+hydration+render" },
      { label: "first_menu_image", ms: pilot.firstMenuImageVisible.median, cause: "image lazy+CDN" },
      { label: "interactive_paint", ms: pilot.interactivePaint.median, cause: "hydration" },
    ]
      .filter((x) => x.ms != null)
      .sort((a, b) => (b.ms ?? 0) - (a.ms ?? 0));
    report.top3BottleneckHypothesis = {
      profile: "Korea LTE (pilot primary)",
      ranked: ranked.slice(0, 3),
      experiencePostMedianMs: byProfile.koreaLte?.sideEffects?.experienceEventPost?.relativeToNavStartMs?.median,
      blockingRisk: "guest_session·experience_events는 useEffect/void — 메뉴 텍스트 paint를 막지 않음 (코드 확인)",
      fast3gRegressionMenuTextMedian: byProfile.fast3g?.coldQrToMenu?.menuTextVisible?.median,
    };
  }

  const outPath = resolve(root, "consumer-rigor-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`[consumer-rigor] wrote ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
