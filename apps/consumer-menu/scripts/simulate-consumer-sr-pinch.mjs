#!/usr/bin/env node
/**
 * SR·핀치 줌·barrier-free 회귀 시뮬레이션 (기본 25회).
 *
 * Usage:
 *   node apps/consumer-menu/scripts/simulate-consumer-sr-pinch.mjs [tenant] [baseUrl]
 *   SR_RUNS=25 node apps/consumer-menu/scripts/simulate-consumer-sr-pinch.mjs demo
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const outDir = resolve(root, "bench-captures");

const RUNS = Math.max(1, Number(process.env.SR_RUNS) || 25);
const baseUrl = (process.argv[3] || process.env.BENCH_BASE_URL || "http://localhost:3098").replace(
  /\/$/,
  "",
);
const tenant = process.argv[2] || "demo";
const SR_KEY = `chaya_sr_mode_v1:${encodeURIComponent(tenant.trim())}`;

async function loadPlaywright() {
  const mod = await import("playwright");
  return mod.chromium ? mod : mod.default;
}

function viewportLocked(content) {
  return /maximum-scale=1/i.test(content) && /user-scalable=no/i.test(content);
}

function viewportAllowed(content) {
  return /maximum-scale=5/i.test(content) && /user-scalable=yes/i.test(content);
}

async function readDomState(page) {
  return page.evaluate(() => {
    const html = document.documentElement;
    const meta = document.querySelector('meta[name="viewport"]');
    return {
      pathname: location.pathname,
      srAttr: html.hasAttribute("data-consumer-screen-reader-mode"),
      pinchAttr: html.getAttribute("data-consumer-pinch-zoom"),
      consumerAttr: html.hasAttribute("data-chaya-consumer"),
      viewport: meta?.getAttribute("content") ?? "",
      menuBoardSsr: !!document.getElementById("menu-board-ssr"),
      barrierHeading: document.querySelector("#main-content h1, #main-content h2")?.textContent?.trim() ?? "",
      hasMenuRows: document.querySelectorAll("#main-content .menu-list-row-sr, #main-content [role='listitem']").length,
    };
  });
}

async function setSrStorage(page, on) {
  await page.evaluate(
    ([key, value]) => {
      sessionStorage.setItem(key, value);
    },
    [SR_KEY, on ? "1" : "0"],
  );
}

async function primeOrigin(page) {
  await page.goto(`${baseUrl}/t/${tenant}`, { waitUntil: "domcontentloaded" });
}

/** @typedef {{ id: string, ok: boolean, detail: string }} CaseResult */

/** @param {import('playwright').Page} page @returns {Promise<CaseResult[]>} */
async function runScenario(page) {
  const results = [];
  const home = `/t/${tenant}`;
  const barrier = `/t/${tenant}/barrier-free`;
  const cart = `/t/${tenant}/cart`;

  const assert = (id, ok, detail) => {
    results.push({ id, ok, detail });
  };

  // 1) SR OFF — 기본 메뉴, 줌 잠금
  await primeOrigin(page);
  await setSrStorage(page, false);
  await page.goto(`${baseUrl}${home}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(400);
  let s = await readDomState(page);
  assert(
    "sr-off-home-stays",
    s.pathname === home || s.pathname === `${home}/`,
    `path=${s.pathname}`,
  );
  assert("sr-off-viewport-locked", viewportLocked(s.viewport), s.viewport);
  assert("sr-off-no-pinch-attr", s.pinchAttr !== "allowed", `pinch=${s.pinchAttr}`);

  // 2) SR ON in storage — barrier-free 직접 로드 시 튕기지 않음
  await setSrStorage(page, true);
  await page.goto(`${baseUrl}${barrier}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  s = await readDomState(page);
  assert(
    "sr-on-barrier-free-stays",
    s.pathname.includes("/barrier-free"),
    `path=${s.pathname}`,
  );
  assert("sr-on-viewport-allowed", viewportAllowed(s.viewport), s.viewport);
  assert("sr-on-pinch-attr", s.pinchAttr === "allowed", `pinch=${s.pinchAttr}`);
  assert("sr-on-dom-flag", s.srAttr, "missing data-consumer-screen-reader-mode");

  // 3) SR ON — 장바구니에서도 핀치 허용
  await page.goto(`${baseUrl}${cart}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  s = await readDomState(page);
  assert("sr-on-cart-pinch", viewportAllowed(s.viewport), s.viewport);
  assert("sr-on-cart-stays", s.pathname.startsWith(cart), `path=${s.pathname}`);

  // 4) SR OFF — barrier-free에서 홈으로 복귀 (hydration 후)
  await setSrStorage(page, false);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(900);
  s = await readDomState(page);
  assert(
    "sr-off-leaves-barrier-free",
    !s.pathname.includes("/barrier-free"),
    `path=${s.pathname}`,
  );
  assert("sr-off-after-toggle-locked", viewportLocked(s.viewport), s.viewport);

  // 5) 헤더 SR 토글 ON → barrier-free 이동
  await page.goto(`${baseUrl}${home}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  const a11yBtn = page.locator('button[aria-pressed][title], button[aria-pressed][aria-label]').first();
  if (await a11yBtn.count()) {
    await a11yBtn.click();
    await page.waitForTimeout(800);
    s = await readDomState(page);
    assert(
      "toolbar-toggle-to-barrier",
      s.pathname.includes("/barrier-free"),
      `path=${s.pathname}`,
    );
    assert("toolbar-toggle-pinch", viewportAllowed(s.viewport), s.viewport);
  } else {
    assert("toolbar-toggle-to-barrier", false, "a11y toggle not found");
  }

  // 6) 하단 탭 메뉴 링크가 barrier-free를 가리키는지
  const menuTab = page.locator('nav a[href*="/barrier-free"], nav a[aria-label]').first();
  const href = (await menuTab.count()) ? await menuTab.getAttribute("href") : "";
  assert(
    "bottom-nav-barrier-href",
    typeof href === "string" && href.includes("/barrier-free"),
    `href=${href ?? "none"}`,
  );

  return results;
}

async function main() {
  const pw = await loadPlaywright();
  mkdirSync(outDir, { recursive: true });

  const browser = await pw.chromium.launch({ headless: true });
  const allRuns = [];
  let totalFails = 0;

  console.log(`SR/pinch simulation — ${RUNS} runs — ${baseUrl} tenant=${tenant}`);

  for (let run = 1; run <= RUNS; run += 1) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    const cases = await runScenario(page);
    const fails = cases.filter((c) => !c.ok);
    totalFails += fails.length;
    allRuns.push({ run, fails: fails.length, cases });
    const mark = fails.length ? "FAIL" : "PASS";
    console.log(
      `${mark} run ${run}/${RUNS} — ${fails.length} fail — ${fails.map((f) => f.id).join(", ") || "ok"}`,
    );
    await context.close();
  }

  await browser.close();

  const failCounts = {};
  for (const run of allRuns) {
    for (const c of run.cases) {
      if (!c.ok) failCounts[c.id] = (failCounts[c.id] ?? 0) + 1;
    }
  }

  const report = {
    baseUrl,
    tenant,
    runs: RUNS,
    totalFails,
    passRate: `${Math.round(((RUNS * 10 - totalFails) / (RUNS * 10)) * 100)}%`,
    failCounts,
    allRuns,
    ts: new Date().toISOString(),
  };

  const reportPath = resolve(root, "consumer-sr-pinch-report.json");
  writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${reportPath}`);
  console.log(`Total failures: ${totalFails} / ${RUNS * 10} checks`);

  if (totalFails > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
