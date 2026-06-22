#!/usr/bin/env node
/**
 * Fast 3G throttle 바닥선 — 1줄 HTML vs 메뉴 홈 비교
 *
 * Usage: node scripts/measure-throttle-floor.mjs [tenant] [baseUrl]
 */
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const RUNS = Math.max(20, Number(process.env.PERF_RUNS) || 25);
const baseUrl = (process.argv[3] || process.env.BENCH_BASE_URL || "https://chaya-app.vercel.app").replace(
  /\/$/,
  "",
);
const tenant = process.argv[2] || "demo";
const menuUrl = `${baseUrl}/t/${encodeURIComponent(tenant)}`;

/** measure-consumer-rigor.mjs 와 동일 */
const FAST_3G = {
  label: "Fast 3G",
  downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8),
  uploadThroughput: Math.floor((750 * 1024) / 8),
  latency: 562.5,
};

const MINIMAL_HTML = "<!DOCTYPE html><html><body><h3 id=\"bench-target\">ok</h3></body></html>";
const MINIMAL_BYTES = Buffer.byteLength(MINIMAL_HTML, "utf8");

function stats(nums) {
  const sorted = nums.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return { n: 0, min: null, median: null, p95: null, max: null };
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  const p95Idx = Math.ceil(0.95 * sorted.length) - 1;
  return {
    n: sorted.length,
    min: sorted[0],
    median,
    p95: sorted[Math.max(0, p95Idx)],
    max: sorted[sorted.length - 1],
  };
}

async function loadPlaywright() {
  const mod = await import("playwright");
  return mod.chromium ? mod : mod.default;
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

async function measureUrl(pw, url, selector, label) {
  const ttfbMs = [];
  const textMs = [];

  for (let i = 0; i < RUNS; i++) {
    const browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    });
    const page = await context.newPage();
    await applyThrottle(page, FAST_3G);

    const navStart = performance.now();
    let docTtfb = null;

    page.on("response", (res) => {
      const req = res.request();
      if (req.method() === "GET" && req.url().split("?")[0] === url.split("?")[0] && docTtfb == null) {
        docTtfb = Math.round(performance.now() - navStart);
      }
    });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120_000 });
      if (docTtfb == null) docTtfb = Math.round(performance.now() - navStart);
      ttfbMs.push(docTtfb);

      await page.waitForSelector(selector, { state: "visible", timeout: 120_000 });
      textMs.push(Math.round(performance.now() - navStart));
    } catch (e) {
      console.error(`[floor] ${label} sample ${i + 1} failed:`, e.message ?? e);
    } finally {
      await browser.close();
    }
  }

  return { label, url, selector, documentTtfb: stats(ttfbMs), textVisible: stats(textMs) };
}

function startMinimalServer() {
  return new Promise((resolvePromise) => {
    const server = createServer((_req, res) => {
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(MINIMAL_HTML);
    });
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolvePromise({ server, url: `http://127.0.0.1:${port}/` });
    });
  });
}

async function main() {
  const pw = await loadPlaywright();
  const { server, url: minimalUrl } = await startMinimalServer();

  console.error(`[floor] minimal 1-line HTML (${MINIMAL_BYTES}B) x${RUNS}…`);
  const minimal = await measureUrl(pw, minimalUrl, "#bench-target", "minimal-1line-local");

  console.error(`[floor] menu home h3 x${RUNS}…`);
  const menu = await measureUrl(pw, menuUrl, "#main-content h3", "menu-home-production");

  server.close();

  const targetMs = 1500;
  const floorMedian = minimal.textVisible.median;
  const menuMedian = menu.textVisible.median;
  const headroomMs = menuMedian != null && floorMedian != null ? menuMedian - floorMedian : null;

  const report = {
    measuredAt: new Date().toISOString(),
    throttleProfile: {
      ...FAST_3G,
      downloadMbps: 1.6,
      uploadKbps: 750,
      note: "CDP Network.emulateNetworkConditions — measure-consumer-rigor.mjs 와 동일",
    },
    runs: RUNS,
    minimalOneLineHtml: {
      htmlUtf8Bytes: MINIMAL_BYTES,
      htmlLiteral: MINIMAL_HTML,
      ...minimal,
    },
    menuHomeReference: menu,
    goalAnalysis: {
      targetTextVisibleMs: targetMs,
      throttleFloorMedianMs: floorMedian,
      floorAsPctOfTarget: floorMedian != null ? Math.round((floorMedian / targetMs) * 100) : null,
      menuMedianMs: menuMedian,
      menuMinusFloorMs: headroomMs,
      menuMinusFloorPctOfMenu:
        headroomMs != null && menuMedian != null ? Math.round((headroomMs / menuMedian) * 100) : null,
      interpretation:
        floorMedian != null
          ? `Fast 3G 합성 환경에서 1줄 HTML도 최소 ~${floorMedian}ms. 1.5s 목표 중 ~${Math.round((floorMedian / targetMs) * 100)}%는 throttle/RTT 바닥.`
          : null,
    },
  };

  const out = resolve(root, "consumer-throttle-floor-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`[floor] wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
