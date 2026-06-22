#!/usr/bin/env node
/**
 * login / signup / barrier-free — loading.tsx 제거 후 빈 main 구간(ms) + 스크린샷
 *
 * Usage: node scripts/capture-consumer-blank-nav.mjs [tenant] [baseUrl]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "bench-captures");

const RUNS = Math.max(8, Number(process.env.BLANK_RUNS) || 10);
const baseUrl = (process.argv[3] || process.env.BENCH_BASE_URL || "https://chaya-app.vercel.app").replace(
  /\/$/,
  "",
);
const tenant = process.argv[2] || "demo";

const FAST_3G = {
  downloadThroughput: Math.floor((1.6 * 1024 * 1024) / 8),
  uploadThroughput: Math.floor((750 * 1024) / 8),
  latency: 562.5,
};

const ROUTES = [
  {
    id: "login",
    path: `/t/${tenant}/login`,
    readySelector: "#main-content h1",
    blankProbe: () => "#main-content",
  },
  {
    id: "signup",
    path: `/t/${tenant}/signup`,
    readySelector: "#main-content h1",
    blankProbe: () => "#main-content",
  },
  {
    id: "barrier-free",
    path: `/t/${tenant}/barrier-free`,
    readySelector: "#main-content button, #main-content [role='listitem']",
    blankProbe: () => "#main-content",
  },
];

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

async function applyThrottle(page) {
  const session = await page.context().newCDPSession(page);
  await session.send("Network.enable");
  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    ...FAST_3G,
  });
}

async function mainContentState(page) {
  return page.evaluate(() => {
    const main = document.querySelector("#main-content");
    if (!main) return { exists: false, childCount: 0, textLen: 0, hasVisibleText: false, preview: "" };

    const isVisibleEl = (el) => {
      if (!(el instanceof HTMLElement)) return false;
      if (el.classList.contains("sr-only") || el.closest(".sr-only")) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      const r = el.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return false;
      const text = (el.textContent || "").trim();
      return text.length > 0;
    };

    const visibleText = [...main.querySelectorAll("h1,h2,h3,p,button,input,label,a,li")]
      .filter(isVisibleEl)
      .map((el) => (el.textContent || "").trim())
      .filter(Boolean)
      .join(" | ");

    return {
      exists: true,
      childCount: main.childElementCount,
      textLen: visibleText.length,
      hasVisibleText: visibleText.length > 0,
      preview: visibleText.slice(0, 80),
    };
  });
}

async function captureFilmstrip(page, routeId, url, readySelector) {
  const shots = [];
  const navStart = performance.now();

  const snap = async (label) => {
    const at = Math.round(performance.now() - navStart);
    const file = resolve(outDir, `${routeId}-${label}-${at}ms.png`);
    await page.screenshot({ path: file, fullPage: false });
    shots.push({ label, actualMs: at, file, main: await mainContentState(page) });
  };

  await snap("00-nav-start");
  await page.goto(url, { waitUntil: "commit", timeout: 120_000 });
  await snap("01-after-commit");

  for (const delay of [300, 600, 900, 1200, 1500, 1800, 2100, 2400, 2700]) {
    const elapsed = performance.now() - navStart;
    const wait = delay - elapsed;
    if (wait > 0) await page.waitForTimeout(wait);
    const state = await mainContentState(page);
    await snap(`load-${String(Math.round(performance.now() - navStart)).padStart(4, "0")}`);
    if (state.hasVisibleText) break;
  }

  try {
    await page.waitForSelector(readySelector, { state: "visible", timeout: 60_000 });
    await snap("ready");
  } catch {
    await snap("timeout");
  }
  return shots;
}

async function measureRoute(pw, route) {
  const url = `${baseUrl}${route.path}`;
  const blankUntilContentMs = [];
  const readyVisibleMs = [];
  const ttfbMs = [];
  let filmstrip = null;

  // filmstrip — 로드 중 스냅샷 1회
  {
    const browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      locale: "ko-KR",
    });
    const page = await context.newPage();
    await applyThrottle(page);
    filmstrip = await captureFilmstrip(page, route.id, url, route.readySelector);
    await browser.close();
  }

  for (let i = 0; i < RUNS; i++) {
    const browser = await pw.chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
      locale: "ko-KR",
    });
    const page = await context.newPage();
    await applyThrottle(page);

    const navStart = performance.now();
    let docTtfb = null;
    let firstMainContentMs = null;
    let blankEndMs = null;

    page.on("response", (res) => {
      const req = res.request();
      if (req.method() === "GET" && req.url().split("?")[0] === url && docTtfb == null) {
        docTtfb = Math.round(performance.now() - navStart);
      }
    });

    const poll = setInterval(async () => {
      try {
        const state = await mainContentState(page);
        const elapsed = Math.round(performance.now() - navStart);
        if (state.childCount > 0 && firstMainContentMs == null) firstMainContentMs = elapsed;
        if (state.hasVisibleText && blankEndMs == null) blankEndMs = elapsed;
      } catch {
        /* navigating */
      }
    }, 40);

    try {
      await page.goto(url, { waitUntil: "commit", timeout: 120_000 });
      await page.waitForSelector(route.readySelector, { state: "visible", timeout: 120_000 });
      const readyAt = Math.round(performance.now() - navStart);
      readyVisibleMs.push(readyAt);
      if (docTtfb == null) docTtfb = readyAt;
      ttfbMs.push(docTtfb);
      blankUntilContentMs.push(blankEndMs ?? firstMainContentMs ?? readyAt);
    } catch (e) {
      console.error(`[blank] ${route.id} sample ${i + 1} failed:`, e.message ?? e);
    } finally {
      clearInterval(poll);
      await browser.close();
    }
  }

  return {
    id: route.id,
    url,
    readySelector: route.readySelector,
    note: "tenant loading.tsx 제거 후 — main에 본문 텍스트/폼 나오기 전 구간",
    documentTtfb: stats(ttfbMs),
    blankUntilMainVisibleText: stats(blankUntilContentMs),
    readySelectorVisible: stats(readyVisibleMs),
    filmstrip,
  };
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const pw = await loadPlaywright();
  const routes = [];

  for (const route of ROUTES) {
    console.error(`[blank] ${route.id} x${RUNS}…`);
    routes.push(await measureRoute(pw, route));
  }

  const report = {
    measuredAt: new Date().toISOString(),
    throttleProfile: { ...FAST_3G, downloadMbps: 1.6, uploadKbps: 750 },
    runs: RUNS,
    captureDir: outDir,
    routes,
  };

  const out = resolve(root, "consumer-blank-nav-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`[blank] wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
