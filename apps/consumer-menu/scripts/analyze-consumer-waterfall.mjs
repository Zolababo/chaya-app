#!/usr/bin/env node
/**
 * TTFB → menu h3 visible 구간 네트워크 워터폴·의존성 체인 분석 (Fast 3G CDP)
 *
 * Usage: node scripts/analyze-consumer-waterfall.mjs [tenant] [baseUrl]
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { performance } from "node:perf_hooks";

import { resolveThrottleProfile } from "./consumer-throttle-profiles.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const baseUrl = (process.argv[3] || "https://chaya-app.vercel.app").replace(/\/$/, "");
const tenant = process.argv[2] || "demo";
const menuUrl = `${baseUrl}/t/${encodeURIComponent(tenant)}`;

const { key: profileKey, profile: THROTTLE } = resolveThrottleProfile(process.env.BENCH_PROFILE);

function shortUrl(url) {
  try {
    const u = new URL(url);
    const p = u.pathname;
    if (p.includes("/_next/static/")) {
      const parts = p.split("/");
      return `/_next/static/.../${parts[parts.length - 1]}`;
    }
    return p + (u.search ? u.search.slice(0, 24) : "");
  } catch {
    return url.slice(0, 80);
  }
}

function bucket(url, mime = "", type = "") {
  const u = url.split("?")[0];
  if (type === "Document" || u.endsWith(menuUrl.split("?")[0])) return "document";
  if (u.includes("/_next/static/") && u.endsWith(".js")) return "js";
  if (u.includes("/_next/static/") && u.endsWith(".css")) return "css";
  if (mime.includes("font") || u.includes("fonts.googleapis") || u.includes(".woff")) return "font";
  if (u.includes("/menu-thumb") || type === "Image") return "image";
  if (url.includes("_rsc=") || mime.includes("text/x-component")) return "rsc";
  return "other";
}

/** initiator → parent requestId (document = null) */
function parentRequestId(initiator, urlToId) {
  if (!initiator) return null;
  const t = initiator.type;
  if (t === "parser" || t === "other" || t === "preload" || t === "early") {
    return null; // discovered from document HTML — same wave as doc parse
  }
  if (t === "script") {
    const stack = initiator.stack;
    if (stack?.callFrames?.length) {
      const frameUrl = stack.callFrames[0].url;
      if (frameUrl && urlToId.has(frameUrl)) return urlToId.get(frameUrl);
    }
    if (initiator.url && urlToId.has(initiator.url)) return urlToId.get(initiator.url);
  }
  return null;
}

function depthOf(id, parentMap, memo = new Map()) {
  if (memo.has(id)) return memo.get(id);
  const p = parentMap.get(id);
  const d = p == null ? 0 : 1 + depthOf(p, parentMap, memo);
  memo.set(id, d);
  return d;
}

function waveIndex(startMs, waveMs = 120) {
  return Math.floor(startMs / waveMs);
}

async function loadPlaywright() {
  const mod = await import("playwright");
  return mod.chromium ? mod : mod.default;
}

async function analyzeSample(pw) {
  const browser = await pw.chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36",
    locale: "ko-KR",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, ...THROTTLE });

  const navStartPerf = performance.now();
  let navStartCdp = null;
  const byId = new Map();
  const urlToId = new Map();
  const parentMap = new Map();

  cdp.on("Network.requestWillBeSent", (e) => {
    if (navStartCdp == null) navStartCdp = e.timestamp;
    const tMs = Math.round((e.timestamp - navStartCdp) * 1000 * 10) / 10;
    byId.set(e.requestId, {
      id: e.requestId,
      url: e.request.url,
      method: e.request.method,
      type: e.type,
      initiatorType: e.initiator?.type ?? "unknown",
      startMs: tMs,
      endMs: null,
      transfer: 0,
      mime: "",
      status: 0,
    });
    urlToId.set(e.request.url, e.requestId);
    const parent = parentRequestId(e.initiator, urlToId);
    parentMap.set(e.requestId, parent);
  });

  cdp.on("Network.responseReceived", (e) => {
    const row = byId.get(e.requestId);
    if (!row) return;
    row.mime = e.response.mimeType || "";
    row.status = e.response.status;
    const timing = e.response.timing;
    if (timing?.receiveHeadersEnd >= 0) {
      row.ttfbFromStartMs = Math.round(row.startMs + timing.receiveHeadersEnd);
    }
  });

  cdp.on("Network.loadingFinished", (e) => {
    const row = byId.get(e.requestId);
    if (!row) return;
    row.endMs = Math.round((e.timestamp - navStartCdp) * 1000 * 10) / 10;
    row.transfer = e.encodedDataLength ?? 0;
  });

  let docTtfb = null;
  page.on("response", (res) => {
    const req = res.request();
    if (req.method() === "GET" && req.url().startsWith(menuUrl.split("?")[0]) && docTtfb == null) {
      docTtfb = Math.round(performance.now() - navStartPerf);
    }
  });

  await page.goto(menuUrl, { waitUntil: "domcontentloaded", timeout: 180_000 });
  if (docTtfb == null) docTtfb = Math.round(performance.now() - navStartPerf);

  await page.waitForSelector("#main-content h3", { state: "visible", timeout: 120_000 });
  const textAt = Math.round(performance.now() - navStartPerf);

  const perfEntries = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      navigation: nav
        ? {
            domInteractive: Math.round(nav.domInteractive),
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
            responseEnd: Math.round(nav.responseEnd),
            transferSize: nav.transferSize,
          }
        : null,
      resources: performance.getEntriesByType("resource").map((r) => ({
        name: r.name.split("/").slice(-2).join("/"),
        initiatorType: r.initiatorType,
        startTime: Math.round(r.startTime),
        responseEnd: Math.round(r.responseEnd),
        duration: Math.round(r.duration),
        transferSize: r.transferSize,
      })),
    };
  });

  const rowsAll = [...byId.values()].sort((a, b) => a.startMs - b.startMs);
  const rows = rowsAll.filter((r) => r.startMs <= textAt + 100);

  const depths = rows.map((r) => depthOf(r.id, parentMap));
  const maxDepth = depths.length ? Math.max(...depths) : 0;

  const byBucket = {};
  for (const r of rows) {
    const b = bucket(r.url, r.mime, r.type);
    byBucket[b] = (byBucket[b] ?? 0) + 1;
  }

  // Sequential waves: group by start time clusters (requests starting within 50ms = same wave)
  const WAVE_GAP = 80;
  const waves = [];
  for (const r of rows) {
    const last = waves[waves.length - 1];
    if (!last || r.startMs - last.endStartMs > WAVE_GAP) {
      waves.push({ startMs: r.startMs, endStartMs: r.startMs, count: 1, buckets: [bucket(r.url, r.mime, r.type)] });
    } else {
      last.endStartMs = r.startMs;
      last.count += 1;
      last.buckets.push(bucket(r.url, r.mime, r.type));
    }
  }

  // Critical path estimate: longest chain by finish time
  const finishTimes = rows.map((r) => r.endMs ?? r.ttfbFromStartMs ?? r.startMs);
  const lastFinish = finishTimes.length ? Math.max(...finishTimes) : textAt;

  // Requests that START only after document TTFB (parser-blocked discovery)
  const afterDoc = rows.filter((r) => r.type !== "Document" && r.startMs >= docTtfb);
  const beforeTextFromDoc = afterDoc.filter((r) => (r.endMs ?? textAt) <= textAt + 50);

  // Initiator breakdown for JS
  const jsRows = rows.filter((r) => bucket(r.url, r.mime, r.type) === "js");
  const jsInitiators = {};
  for (const r of jsRows) {
    jsInitiators[r.initiatorType] = (jsInitiators[r.initiatorType] ?? 0) + 1;
  }

  // Theoretical RTT floor: (waves with serial deps) * latency
  const serialWaveCount = waves.filter((w) => w.count === 1).length;

  const resBeforeText = perfEntries.resources.filter((r) => r.responseEnd <= textAt + 50);
  const resAfterTextStartBeforeEnd = perfEntries.resources.filter(
    (r) => r.startTime <= textAt && r.responseEnd > textAt,
  );
  const resStartedAfterText = perfEntries.resources.filter((r) => r.startTime > textAt);

  const cssRowsAll = rowsAll.filter((r) => bucket(r.url, r.mime, r.type) === "css");
  const lastCssEndMs = cssRowsAll.reduce((max, r) => Math.max(max, r.endMs ?? 0), 0) || null;
  const cssEndToTextGapMs = lastCssEndMs != null ? textAt - lastCssEndMs : null;

  await browser.close();

  return {
    docTtfb,
    textAt,
    gapMs: textAt - docTtfb,
    requestCountUntilText: rows.length,
    requestBuckets: byBucket,
    maxInitiatorDepth: maxDepth,
    startWaveCount: waves.length,
    serialSingleRequestWaves: serialWaveCount,
    wavesUntilText: waves.slice(0, 12).map((w) => ({
      startMs: w.startMs,
      parallelCount: w.count,
      buckets: [...new Set(w.buckets)],
    })),
    jsChunkCount: jsRows.length,
    jsInitiatorTypes: jsInitiators,
    requestsStartingAfterDocTtfb: afterDoc.length,
    requestsFinishedBeforeText: beforeTextFromDoc.length,
    lastNetworkFinishMs: lastFinish,
    lastCssEndMs,
    cssEndToTextGapMs,
    perfResourceCount: perfEntries.resources.length,
    perfResourcesUntilText: resBeforeText.length,
    perfResourcesInFlightAtText: resAfterTextStartBeforeEnd.length,
    perfResourcesStartedAfterText: resStartedAfterText.length,
    navigationTiming: perfEntries.navigation,
    perfWaves: (() => {
      const sorted = [...perfEntries.resources].sort((a, b) => a.startTime - b.startTime);
      const waves = [];
      for (const r of sorted) {
        const last = waves[waves.length - 1];
        if (!last || r.startTime - last.endStart > 80) {
          waves.push({ startMs: r.startTime, endStart: r.startTime, count: 1, types: [r.initiatorType] });
        } else {
          last.endStart = r.startTime;
          last.count += 1;
          last.types.push(r.initiatorType);
        }
      }
      return waves.slice(0, 8);
    })(),
    perfResourcesBeforeText: resBeforeText.slice(0, 15),
    perfResourcesInFlightAtTextSample: resAfterTextStartBeforeEnd.slice(0, 10),
    topByStart: rows.slice(0, 20).map((r) => ({
      startMs: r.startMs,
      endMs: r.endMs,
      transferKb: Math.round((r.transfer / 1024) * 10) / 10,
      bucket: bucket(r.url, r.mime, r.type),
      initiator: r.initiatorType,
      url: shortUrl(r.url),
    })),
    topByTransfer: [...rows]
      .sort((a, b) => b.transfer - a.transfer)
      .slice(0, 10)
      .map((r) => ({
        transferKb: Math.round((r.transfer / 1024) * 10) / 10,
        startMs: r.startMs,
        endMs: r.endMs,
        bucket: bucket(r.url, r.mime, r.type),
        url: shortUrl(r.url),
      })),
  };
}

function median(nums) {
  const s = nums.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

async function main() {
  const pw = await loadPlaywright();
  const SAMPLES = Number(process.env.WATERFALL_RUNS) || 3;
  const samples = [];

  console.error(`[waterfall] ${menuUrl} Fast 3G x${SAMPLES}…`);
  for (let i = 0; i < SAMPLES; i++) {
    samples.push(await analyzeSample(pw));
    console.error(`[waterfall] sample ${i + 1}/${SAMPLES} ok`);
  }

  const report = {
    measuredAt: new Date().toISOString(),
    menuUrl,
    throttleProfile: {
      name: "Fast 3G (Chrome DevTools / CDP Network.emulateNetworkConditions)",
      downloadMbps: 1.6,
      uploadKbps: 750,
      latencyMs: THROTTLE.latency,
      note: "latency는 요청마다 추가되는 최소 네트워크 지연(ms). Chrome Fast 3G 프리셋 = 562.5ms. RTT ≈ 2×562.5ms + 처리시간.",
    },
    timingMs: {
      documentTtfbMedian: median(samples.map((s) => s.docTtfb)),
      menuTextVisibleMedian: median(samples.map((s) => s.textAt)),
      gapTtfbToTextMedian: median(samples.map((s) => s.gapMs)),
      lastNetworkFinishMedian: median(samples.map((s) => s.lastNetworkFinishMs)),
      lastCssEndMedian: median(samples.map((s) => s.lastCssEndMs)),
      cssEndToTextGapMedian: median(samples.map((s) => s.cssEndToTextGapMs)),
    },
    requestsUntilText: {
      totalMedian: median(samples.map((s) => s.requestCountUntilText)),
      bucketsMedian: Object.fromEntries(
        ["document", "js", "css", "font", "image", "rsc", "other"].map((k) => [
          k,
          median(samples.map((s) => s.requestBuckets[k] ?? 0)),
        ]),
      ),
      jsChunksMedian: median(samples.map((s) => s.jsChunkCount)),
      startingAfterDocTtfbMedian: median(samples.map((s) => s.requestsStartingAfterDocTtfb)),
    },
    dependencyChain: {
      maxInitiatorDepthMedian: median(samples.map((s) => s.maxInitiatorDepth)),
      startWaveCountMedian: median(samples.map((s) => s.startWaveCount)),
      serialSingleRequestWavesMedian: median(samples.map((s) => s.serialSingleRequestWaves)),
      jsInitiatorTypes: samples[0]?.jsInitiatorTypes ?? {},
      interpretation: [
        "startWaveCount: 요청 시작 시각 클러스터(80ms 이내=같은 wave). 많을수록 순차 라운드트립 가능성.",
        "maxInitiatorDepth: script→script initiator 체인 깊이. 2+ 이면 JS가 JS를 연쇄 로드.",
        "document 이후 시작 요청 = HTML 파싱 후에야 발견되는 리소스(JS/CSS/font/preload).",
      ],
    },
    wavesSample0: samples[0]?.wavesUntilText ?? [],
    topRequestsSample0: samples[0]?.topByStart ?? [],
    topTransferSample0: samples[0]?.topByTransfer ?? [],
    rttFloorEstimate: {
      latencyPerHopMs: THROTTLE.latency,
      approximateRttMs: THROTTLE.latency * 2,
      ttfbMedianMs: median(samples.map((s) => s.docTtfb)),
      gapAfterTtfbMedianMs: median(samples.map((s) => s.gapMs)),
      wavesMedian: median(samples.map((s) => s.startWaveCount)),
      serialLatencyFloorMs: median(samples.map((s) => s.startWaveCount)) * THROTTLE.latency * 2,
      note: "이론 하한 ≈ waves × RTT (전송량 0 가정). 실측 gap은 전송+파싱+실행 포함.",
    },
    verdict: null,
  };

  const gap = report.timingMs.gapTtfbToTextMedian;
  const waves = report.dependencyChain.startWaveCountMedian;
  const jsKb = samples[0]?.topByTransfer?.filter((r) => r.bucket === "js").reduce((a, b) => a + b.transferKb, 0) ?? 0;

  if (gap != null && waves != null) {
    const rttFloor = waves * THROTTLE.latency * 2;
    const transferFloorMs = Math.round((183 * 1024 * 8) / (1.6 * 1024 * 1024) * 1000); // ~915ms at 1.6Mbps for 183KB if serial
    report.verdict = {
      primaryBottleneck:
        gap > 1200 && waves >= 4
          ? "latency_round_trips"
          : gap > transferFloorMs * 0.5
            ? "mixed_transfer_and_rtt"
            : "transfer_bytes",
      gapMs: gap,
      estimatedSerialRttFloorMs: Math.round(rttFloor),
      estimatedTransferSerialMs183KB: transferFloorMs,
      explanation:
        gap > rttFloor * 0.6
          ? `TTFB 후 ${gap}ms 구간은 ${waves}개 시작 wave × RTT(~${Math.round(THROTTLE.latency * 2)}ms) 하한(~${Math.round(rttFloor)}ms)과 맞물림 — 순차 발견/실행이 지배적일 가능성 큼.`
          : "전송량·다운로드 시간이 지배적일 가능성.",
    };
  }

  const out = resolve(root, "consumer-waterfall-report.json");
  writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  console.error(`[waterfall] wrote ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
