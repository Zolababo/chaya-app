#!/usr/bin/env node

/**
 * Accessibility baseline checks for key consumer pages.
 * NOTE: This is a regression guard, not an official certification substitute.
 */

const DEFAULT_BASE = "https://chaya-app.vercel.app";
const DEFAULT_TENANT = "demo";

function parseArgs(argv) {
  const args = {
    base: DEFAULT_BASE,
    tenant: DEFAULT_TENANT,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if ((token === "--base" || token === "-b") && argv[i + 1]) {
      args.base = argv[i + 1];
      i += 1;
      continue;
    }
    if ((token === "--tenant" || token === "-t") && argv[i + 1]) {
      args.tenant = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return args;
}

const FETCH_TIMEOUT_MS = 20_000;

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "chaya-a11y-baseline/1.0" },
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

function includesAll(text, markers) {
  return markers.every((m) => text.includes(m));
}

async function main() {
  const { base, tenant } = parseArgs(process.argv.slice(2));
  const root = base.replace(/\/+$/, "");
  const t = encodeURIComponent(tenant);
  const pages = [
    {
      label: "/t/{tenant}",
      url: `${root}/t/${t}`,
      markers: ["본문으로 바로가기", "id=\"main-content\"", "주문 현황"],
    },
    {
      label: "/t/{tenant}/barrier-free",
      url: `${root}/t/${t}/barrier-free`,
      markers: ["목록형 메뉴", "카테고리 선택", "상태 알림"],
    },
    {
      label: "/t/{tenant}/cart",
      url: `${root}/t/${t}/cart`,
      markers: ["주문 확인", "cart-page-heading"],
    },
    {
      label: "/t/{tenant}/orders",
      url: `${root}/t/${t}/orders`,
      markers: ["주문 현황"],
    },
  ];

  let failed = false;
  for (const page of pages) {
    try {
      const { res, body } = await fetchText(page.url);
      if (!res.ok) {
        fail(page.label, `status ${res.status}`);
        failed = true;
        continue;
      }
      if (!includesAll(body, page.markers)) {
        fail(page.label, `missing marker(s): ${page.markers.join(", ")}`);
        failed = true;
        continue;
      }
      pass(page.label, "baseline markers detected");
    } catch (e) {
      fail(page.label, e instanceof Error ? e.message : String(e));
      failed = true;
    }
  }

  if (failed) {
    process.exitCode = 1;
    console.error("A11y baseline check failed");
    return;
  }
  console.log("A11y baseline check passed");
}

main();
