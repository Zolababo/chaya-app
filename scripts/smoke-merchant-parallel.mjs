#!/usr/bin/env node

/**
 * Merchant parallel smoke checks (Blue/Green).
 * - Green: /m/{tenant}/dashboard, orders, menus, analytics, categories
 * - Blue: legacy merchant URL reachability
 */

const DEFAULT_GREEN_BASE = "https://chaya-app.vercel.app";
const DEFAULT_BLUE_BASE = "https://chaya-menu-test.vercel.app";

function parseArgs(argv) {
  const args = {
    greenBase: DEFAULT_GREEN_BASE,
    blueBase: DEFAULT_BLUE_BASE,
    tenant: "demo",
    retries: 3,
    retryDelayMs: 4_000,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--green-base" && argv[i + 1]) {
      args.greenBase = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--blue-base" && argv[i + 1]) {
      args.blueBase = argv[i + 1];
      i += 1;
      continue;
    }
    if ((token === "--tenant" || token === "-t") && argv[i + 1]) {
      args.tenant = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--retries" && argv[i + 1]) {
      const n = Number.parseInt(argv[i + 1], 10);
      if (Number.isFinite(n) && n > 0) args.retries = n;
      i += 1;
      continue;
    }
    if (token === "--retry-delay-ms" && argv[i + 1]) {
      const n = Number.parseInt(argv[i + 1], 10);
      if (Number.isFinite(n) && n >= 0) args.retryDelayMs = n;
      i += 1;
      continue;
    }
  }
  return args;
}

const FETCH_TIMEOUT_MS = 20_000;

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "chaya-merchant-smoke/1.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const body = await res.text();
  return { res, body };
}

function pass(label, detail) {
  console.log(`PASS ${label}: ${detail}`);
}

function fail(label, detail) {
  console.error(`FAIL ${label}: ${detail}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Any group matches if every string in that group is a substring of body (OR across groups). */
function bodyMatchesAnyGroup(body, groups) {
  return groups.some((g) => g.every((t) => body.includes(t)));
}

async function checkWithRetry({
  label,
  url,
  retries,
  retryDelayMs,
  markerGroups,
}) {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const { res, body } = await fetchText(url);
      if (!res.ok) {
        if (attempt === retries) {
          fail(label, `${res.status}`);
          return false;
        }
      } else {
        const hasMarker = bodyMatchesAnyGroup(body, markerGroups);
        if (hasMarker) {
          pass(label, `${res.status} (attempt ${attempt}/${retries})`);
          return true;
        }
        if (attempt === retries) {
          fail(label, "marker text missing");
          return false;
        }
      }
    } catch (e) {
      if (attempt === retries) {
        fail(label, e instanceof Error ? e.message : String(e));
        return false;
      }
    }

    await sleep(retryDelayMs);
  }
  return false;
}

async function main() {
  const { greenBase, blueBase, tenant, retries, retryDelayMs } = parseArgs(process.argv.slice(2));
  const greenRoot = greenBase.replace(/\/+$/, "");
  const blueRoot = blueBase.replace(/\/+$/, "");
  const enc = encodeURIComponent(tenant);
  const greenDashboardUrl = `${greenRoot}/m/${enc}/dashboard`;
  const greenOrdersUrl = `${greenRoot}/m/${enc}/orders`;
  const greenMenusUrl = `${greenRoot}/m/${enc}/menus`;
  const greenAnalyticsUrl = `${greenRoot}/m/${enc}/analytics`;
  const greenCategoriesUrl = `${greenRoot}/m/${enc}/categories`;
  const blueUrl = `${blueRoot}/`;

  const loginMarkers = [
    ["점주 로그인", "이메일", "비밀번호"],
    ["점주 로그인", "인증번호 받기"],
    ["문자 인증", "인증번호"],
  ];

  const checks = await Promise.all([
    checkWithRetry({
      label: "green /m/{tenant}/dashboard",
      url: greenDashboardUrl,
      retries,
      retryDelayMs,
      markerGroups: [["대시보드"], ...loginMarkers],
    }),
    checkWithRetry({
      label: "green /m/{tenant}/orders",
      url: greenOrdersUrl,
      retries,
      retryDelayMs,
      markerGroups: [["주문 큐"], ...loginMarkers],
    }),
    checkWithRetry({
      label: "green /m/{tenant}/menus",
      url: greenMenusUrl,
      retries,
      retryDelayMs,
      markerGroups: [["메뉴 관리"], ...loginMarkers],
    }),
    checkWithRetry({
      label: "green /m/{tenant}/analytics",
      url: greenAnalyticsUrl,
      retries,
      retryDelayMs,
      markerGroups: [["기간 실적"], ...loginMarkers],
    }),
    checkWithRetry({
      label: "green /m/{tenant}/categories",
      url: greenCategoriesUrl,
      retries,
      retryDelayMs,
      markerGroups: [["카테고리"], ...loginMarkers],
    }),
    checkWithRetry({
      label: "blue merchant url",
      url: blueUrl,
      retries,
      retryDelayMs,
      markerGroups: [["CHAYA"], ["Restaurant"], ["관리자"], ["Admin"]],
    }),
  ]);

  if (checks.includes(false)) {
    process.exitCode = 1;
    console.error("Merchant parallel smoke failed");
    return;
  }
  console.log("Merchant parallel smoke passed");
}

main();
