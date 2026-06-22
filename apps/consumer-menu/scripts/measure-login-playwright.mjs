#!/usr/bin/env node
/** Login page cold/warm timing only — 25 samples, median+p95 */
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import os from "node:os";

const RUNS = 25;
const baseUrl = "https://chaya-app.vercel.app";

async function loadPlaywright() {
  const root = process.env.PLAYWRIGHT_MODULE_ROOT;
  const mod = root
    ? await import(pathToFileURL(resolve(root, "playwright/index.js")).href)
    : await import("playwright");
  return mod.chromium ? mod : mod.default;
}

function stats(nums) {
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  const median = s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
  const p95 = s[Math.max(0, Math.ceil(0.95 * s.length) - 1)];
  return { n: s.length, min: s[0], median, p95, max: s[s.length - 1], samples: s };
}

async function main() {
  const pw = await loadPlaywright();
  const cold = [];
  for (let i = 0; i < RUNS; i++) {
    const browser = await pw.chromium.launch({ headless: true });
    const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
    const t0 = performance.now();
    await page.goto(`${baseUrl}/m/login`, { waitUntil: "commit" });
    await page.waitForSelector("#m-email", { state: "visible", timeout: 30_000 });
    cold.push(Math.round(performance.now() - t0));
    await browser.close();
  }

  const browser = await pw.chromium.launch({ headless: true });
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  await page.goto(`${baseUrl}/m/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("#m-email");
  const warm = [];
  for (let i = 0; i < RUNS; i++) {
    const t0 = performance.now();
    await page.reload({ waitUntil: "commit" });
    await page.waitForSelector("#m-email", { state: "visible", timeout: 30_000 });
    warm.push(Math.round(performance.now() - t0));
  }
  const jsMetrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const t0 = nav?.startTime ?? 0;
    const scripts = performance
      .getEntriesByType("resource")
      .filter((e) => e.name.includes("/_next/static") && /\.js(\?|$)/.test(e.name));
    return {
      jsTransferBytes: scripts.reduce((a, s) => a + (s.transferSize || 0), 0),
      jsChunkCount: scripts.length,
      ttfbMs: nav ? Math.round(nav.responseStart - t0) : null,
    };
  });
  await browser.close();

  console.log(
    JSON.stringify(
      {
        networkEnvironment: {
          host: os.hostname(),
          platform: `${os.platform()} ${os.release()}`,
          throttling: "none",
          target: baseUrl,
        },
        coldLoginCommitToInteractive: stats(cold),
        warmLoginReloadToInteractive: stats(warm),
        lastWarmLoadResources: jsMetrics,
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
