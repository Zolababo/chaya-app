#!/usr/bin/env node
/**
 * 파일럿 baseline — Korea LTE + Store Wi-Fi (primary), Fast 3G (regression guard)
 *
 * Usage: node scripts/run-consumer-pilot-baseline.mjs [tenant] [baseUrl]
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import {
  CONSUMER_THROTTLE_PROFILES,
  PILOT_PRIMARY_PROFILE_KEYS,
  REGRESSION_GUARD_PROFILE_KEYS,
} from "./consumer-throttle-profiles.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function run(script, extraEnv = {}) {
  const r = spawnSync(process.execPath, [resolve(__dirname, script), "demo"], {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, ...extraEnv },
  });
  if (r.status !== 0) {
    console.error(r.stderr);
    throw new Error(`${script} failed`);
  }
  const jsonStart = r.stdout.indexOf("{");
  return JSON.parse(r.stdout.slice(jsonStart));
}

function pickMenuMetrics(rigorProfile) {
  const cold = rigorProfile?.coldQrToMenu;
  return {
    documentTtfbMedianMs: cold?.documentTtfb?.median,
    menuTextVisibleMedianMs: cold?.menuTextVisible?.median,
    menuTextVisibleP95Ms: cold?.menuTextVisible?.p95,
    firstMenuImageMedianMs: cold?.firstMenuImageVisible?.median,
    jsChunksMedian: rigorProfile?.sideEffects?.jsChunkRequests?.median,
  };
}

function pickPayload(payload) {
  return {
    wireTotalMedianKb: Math.round((payload.transferBytesUntilTextVisible?.totalAllRequestsFinished?.median ?? 0) / 1024),
    jsWireMedianKb: Math.round((payload.transferBytesUntilTextVisible?.jsChunks?.median ?? 0) / 1024),
    inlineFlightCharsMedian: payload.htmlDocumentDetail?.inlineNextFlightScriptChars?.median,
  };
}

console.error("[pilot-baseline] rigor (all profiles)…");
const rigor = run("measure-consumer-rigor.mjs");

const payloadByProfile = {};
for (const key of [...PILOT_PRIMARY_PROFILE_KEYS, ...REGRESSION_GUARD_PROFILE_KEYS]) {
  console.error(`[pilot-baseline] payload (${key})…`);
  payloadByProfile[key] = run("measure-consumer-payload.mjs", { BENCH_PROFILE: key });
}

const pilotPrimary = Object.fromEntries(
  PILOT_PRIMARY_PROFILE_KEYS.map((key) => [
    key,
    {
      profile: CONSUMER_THROTTLE_PROFILES[key],
      menuQrColdStart: pickMenuMetrics(rigor.playwrightColdPath?.[key]),
      payloadUntilText: pickPayload(payloadByProfile[key]),
    },
  ]),
);

const regressionGuard = Object.fromEntries(
  REGRESSION_GUARD_PROFILE_KEYS.map((key) => [
    key,
    {
      profile: CONSUMER_THROTTLE_PROFILES[key],
      menuQrColdStart: pickMenuMetrics(rigor.playwrightColdPath?.[key]),
      payloadUntilText: pickPayload(payloadByProfile[key]),
    },
  ]),
);

const report = {
  measuredAt: new Date().toISOString(),
  phase: "pilot-baseline",
  kpiPolicy: {
    primary: PILOT_PRIMARY_PROFILE_KEYS,
    regressionGuard: REGRESSION_GUARD_PROFILE_KEYS,
    note: "신규 목표 숫자는 pilotPrimary median 기준으로 협의. fast3g는 회귀만.",
  },
  config: rigor.config,
  pilotPrimary,
  regressionGuard,
  suggestedGoalInputs: {
    koreaLteMenuTextMedianMs: pilotPrimary.koreaLte?.menuQrColdStart?.menuTextVisibleMedianMs,
    storeWifiMenuTextMedianMs: pilotPrimary.storeWifi?.menuQrColdStart?.menuTextVisibleMedianMs,
    fast3gMenuTextMedianMs: regressionGuard.fast3g?.menuQrColdStart?.menuTextVisibleMedianMs,
  },
};

const out = resolve(root, "consumer-pilot-baseline.json");
writeFileSync(out, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.error(`[pilot-baseline] wrote ${out}`);
