#!/usr/bin/env node
/** rigor + payload (pilot profile) + waterfall — phase summary */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import { DEFAULT_PILOT_PROFILE } from "./consumer-throttle-profiles.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const phase = process.argv[2] || "unknown";
const benchProfile = process.argv[3] || process.env.BENCH_PROFILE || DEFAULT_PILOT_PROFILE;

function run(script, extraEnv = {}) {
  const r = spawnSync(process.execPath, [resolve(__dirname, script), "demo"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, BENCH_PROFILE: benchProfile, ...extraEnv },
  });
  if (r.status !== 0) {
    console.error(r.stderr);
    throw new Error(`${script} failed`);
  }
  const jsonStart = r.stdout.indexOf("{");
  return JSON.parse(r.stdout.slice(jsonStart));
}

console.error(`[perf-phase] ${phase} — rigor (all profiles)…`);
const rigor = run("measure-consumer-rigor.mjs");
console.error(`[perf-phase] ${phase} — payload (${benchProfile})…`);
const payload = run("measure-consumer-payload.mjs");
console.error(`[perf-phase] ${phase} — waterfall (${benchProfile})…`);
const waterfall = run("analyze-consumer-waterfall.mjs");

function profileSummary(key) {
  const cold = rigor.playwrightColdPath?.[key]?.coldQrToMenu;
  return {
    textMedianMs: cold?.menuTextVisible?.median,
    textP95Ms: cold?.menuTextVisible?.p95,
    ttfbMedianMs: cold?.documentTtfb?.median,
    ttfbP95Ms: cold?.documentTtfb?.p95,
    jsChunksMedian: rigor.playwrightColdPath?.[key]?.sideEffects?.jsChunkRequests?.median,
  };
}

const summary = {
  phase,
  measuredAt: new Date().toISOString(),
  payloadProfile: benchProfile,
  pilotPrimary: {
    koreaLte: profileSummary("koreaLte"),
    storeWifi: profileSummary("storeWifi"),
  },
  regressionGuard: {
    fast3g: profileSummary("fast3g"),
  },
  payloadUntilText: {
    profile: benchProfile,
    wireTotalMedianKb: Math.round(
      (payload.transferBytesUntilTextVisible?.totalAllRequestsFinished?.median ?? 0) / 1024,
    ),
    htmlWireMedianKb: Math.round((payload.transferBytesUntilTextVisible?.htmlDocument?.median ?? 0) / 1024),
    jsWireMedianKb: Math.round((payload.transferBytesUntilTextVisible?.jsChunks?.median ?? 0) / 1024),
    fontsOtherWireMedianKb: Math.round((payload.transferBytesUntilTextVisible?.other?.median ?? 0) / 1024),
    inlineFlightCharsMedian: payload.htmlDocumentDetail?.inlineNextFlightScriptChars?.median,
    lastCssEndMedianMs: waterfall.timingMs?.lastCssEndMedian,
    cssEndToTextGapMedianMs: waterfall.timingMs?.cssEndToTextGapMedian,
  },
};

const out = resolve(root, "consumer-perf-phases.json");
let all = [];
try {
  all = JSON.parse(readFileSync(out, "utf8"));
} catch {
  /* new */
}
all = all.filter((e) => e.phase !== phase);
all.push(summary);
writeFileSync(out, JSON.stringify(all, null, 2));
console.log(JSON.stringify(summary, null, 2));
