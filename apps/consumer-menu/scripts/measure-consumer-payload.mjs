#!/usr/bin/env node
/**
 * TTFB → menu h3 visible 구간 transferSize 분해 (Fast 3G, 콜드)
 *
 * Usage: node scripts/measure-consumer-payload.mjs [tenant] [baseUrl]
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

import { resolveThrottleProfile } from "./consumer-throttle-profiles.mjs";

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

for (const p of [resolve(root, ".env.local"), resolve(root, ".env.production.local")]) {
  loadEnv(p);
}

const RUNS = Math.max(5, Number(process.env.PAYLOAD_RUNS) || 8);
const baseUrl = (process.argv[3] || process.env.BENCH_BASE_URL || "https://chaya-app.vercel.app").replace(
  /\/$/,
  "",
);
const tenant = process.argv[2] || "demo";
const menuUrl = `${baseUrl}/t/${encodeURIComponent(tenant)}`;

const { key: profileKey, profile: THROTTLE } = resolveThrottleProfile(process.env.BENCH_PROFILE);

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function stats(nums) {
  const sorted = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
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

function classifyRequest(url, resourceType, contentType, method) {
  const u = url.split("?")[0];
  if (resourceType === "document" || (method === "GET" && u === menuUrl.split("?")[0])) {
    return "htmlDocument";
  }
  if (
    contentType.includes("text/x-component") ||
    url.includes("_rsc=") ||
    url.includes("?_rsc") ||
    (method === "POST" && url.includes("/t/") && contentType.includes("text/plain"))
  ) {
    return "rscFlight";
  }
  if (u.includes("/_next/static/") && u.endsWith(".js")) return "jsChunk";
  if (u.includes("/menu-thumb") || resourceType === "image") return "image";
  if (u.includes("/_next/static/") && u.endsWith(".css")) return "css";
  return "other";
}

async function loadPlaywright() {
  const mod = await import("playwright");
  return mod.chromium ? mod : mod.default;
}

async function measureSample(pw) {
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    locale: "ko-KR",
  });
  const page = await context.newPage();
  const session = await context.newCDPSession(page);
  await session.send("Network.enable");

  const encodedByRequestId = new Map();
  session.on("Network.loadingFinished", (p) => {
    if (typeof p.encodedDataLength === "number") {
      encodedByRequestId.set(p.requestId, p.encodedDataLength);
    }
  });

  const metaByRequestId = new Map();
  session.on("Network.responseReceived", (p) => {
    const res = p.response;
    metaByRequestId.set(p.requestId, {
      url: res.url,
      mimeType: res.mimeType || "",
      status: res.status,
    });
  });

  await session.send("Network.emulateNetworkConditions", {
    offline: false,
    downloadThroughput: THROTTLE.downloadThroughput,
    uploadThroughput: THROTTLE.uploadThroughput,
    latency: THROTTLE.latency,
  });

  const navStart = performance.now();
  let docTtfb = null;
  let textAt = null;

  const responsePromises = [];
  page.on("response", (response) => {
    responsePromises.push(
      (async () => {
        const req = response.request();
        const url = req.url();
        if (req.method() === "GET" && url.startsWith(menuUrl.split("?")[0]) && docTtfb == null) {
          docTtfb = Math.round(performance.now() - navStart);
        }
      })(),
    );
  });

  await page.goto(menuUrl, { waitUntil: "domcontentloaded", timeout: 180_000 });
  if (docTtfb == null) docTtfb = Math.round(performance.now() - navStart);

  await page.waitForSelector("#main-content h3", { state: "visible", timeout: 120_000 });
  textAt = Math.round(performance.now() - navStart);

  await Promise.all(responsePromises);

  // Collect requests finished before textAt (approximate via encoded lengths available)
  const buckets = {
    htmlDocument: 0,
    rscFlight: 0,
    jsChunk: 0,
    image: 0,
    css: 0,
    other: 0,
    totalTransfer: 0,
  };
  const rows = [];

  for (const [requestId, transfer] of encodedByRequestId) {
    const meta = metaByRequestId.get(requestId);
    if (!meta) continue;
    const bucket = classifyRequest(meta.url, "", meta.mimeType, "GET");
    buckets[bucket] = (buckets[bucket] ?? 0) + transfer;
    buckets.totalTransfer += transfer;
    rows.push({ bucket, transfer, url: meta.url.slice(0, 120), mime: meta.mimeType });
  }

  // HTML inline flight estimate from document body
  const htmlMetrics = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const nextFlightChunks = [...html.matchAll(/self\.__next_f\.push\(\[1,"([^"]|\\.)*"\]\)/g)].map(
      (m) => m[0].length,
    );
    const flightInlineBytes = nextFlightChunks.reduce((a, b) => a + b, 0);
    return {
      htmlCharLength: html.length,
      htmlUtf8Estimate: new Blob([html]).size,
      inlineNextFlightScriptBytes: flightInlineBytes,
      h3Count: document.querySelectorAll("#main-content h3").length,
    };
  });

  await browser.close();

  return {
    docTtfb,
    textAt,
    gapMs: textAt - docTtfb,
    buckets,
    htmlMetrics,
    topRequests: rows.sort((a, b) => b.transfer - a.transfer).slice(0, 12),
  };
}

async function main() {
  const pw = await loadPlaywright();
  const samples = [];

  console.error(`[payload] ${menuUrl} ${THROTTLE.label} x${RUNS}…`);
  for (let i = 0; i < RUNS; i++) {
    try {
      samples.push(await measureSample(pw));
      console.error(`[payload] sample ${i + 1}/${RUNS} ok`);
    } catch (e) {
      console.error(`[payload] sample ${i + 1} failed:`, e.message ?? e);
    }
  }

  const pick = (fn) => stats(samples.map(fn));

  const report = {
    measuredAt: new Date().toISOString(),
    config: { menuUrl, runs: RUNS, profileKey, profileLabel: THROTTLE.label },
    timingMs: {
      documentTtfb: pick((s) => s.docTtfb),
      menuTextVisible: pick((s) => s.textAt),
      gapTtfbToText: pick((s) => s.gapMs),
    },
    transferBytesUntilTextVisible: {
      note: "CDP Network.loadingFinished encodedDataLength 합 (wire bytes, 압축 후)",
      htmlDocument: pick((s) => s.buckets.htmlDocument),
      rscFlightSeparateRequests: pick((s) => s.buckets.rscFlight),
      jsChunks: pick((s) => s.buckets.jsChunk),
      images: pick((s) => s.buckets.image),
      css: pick((s) => s.buckets.css),
      other: pick((s) => s.buckets.other),
      totalAllRequestsFinished: pick((s) => s.buckets.totalTransfer),
    },
    htmlDocumentDetail: {
      note: "첫 document 응답 + HTML 내 inline __next_f (RSC flight가 HTML에 embed된 부분)",
      htmlUtf8Estimate: pick((s) => s.htmlMetrics.htmlUtf8Estimate),
      inlineNextFlightScriptChars: pick((s) => s.htmlMetrics.inlineNextFlightScriptBytes),
    },
    sampleTopRequests: samples[0]?.topRequests ?? [],
  };

  const out = resolve(root, "consumer-payload-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`[payload] wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
