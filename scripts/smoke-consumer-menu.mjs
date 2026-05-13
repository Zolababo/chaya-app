#!/usr/bin/env node

/**
 * Consumer menu production smoke checks (C2 하드닝 1차 자동화).
 * - Verifies /health payload basics
 * - Optionally compares deployment.gitCommitSha to expected SHA (--expected-sha); with retries
 *   (--sha-retries, --sha-retry-delay-ms) when production lags CI
 * - Verifies robots disallow for /m paths
 * - Verifies tenant page responds with menu marker text
 * - Verifies `/t/{tenant}/orders` guest hub shell (“주문 현황”)
 * - Verifies `/t/{tenant}/cart` SSR shell (“주문 확인”)
 * - Verifies `/t/{tenant}/barrier-free` SSR shell (“목록형 메뉴”)
 * - Verifies 결제·직원호출 스텁: GET → 405 (GET 에 부작용 없음, auth 규칙과 정합)
 */

const DEFAULT_BASE_URL = "https://chaya-app.vercel.app";

function parseArgs(argv) {
  const args = {
    base: DEFAULT_BASE_URL,
    tenant: "demo",
    expectedSha: "",
    shaRetries: 0,
    shaRetryDelayMs: 12_000,
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
    if ((token === "--expected-sha" || token === "-s") && argv[i + 1]) {
      args.expectedSha = argv[i + 1].toLowerCase();
      i += 1;
      continue;
    }
    if (token === "--sha-retries" && argv[i + 1]) {
      const n = Number.parseInt(argv[i + 1], 10);
      args.shaRetries = Number.isFinite(n) && n > 0 ? n : args.shaRetries;
      i += 1;
      continue;
    }
    if (token === "--sha-retry-delay-ms" && argv[i + 1]) {
      const n = Number.parseInt(argv[i + 1], 10);
      args.shaRetryDelayMs = Number.isFinite(n) && n >= 0 ? n : args.shaRetryDelayMs;
      i += 1;
      continue;
    }
  }
  if (args.expectedSha && args.shaRetries < 1) {
    args.shaRetries = 8;
  }
  if (!args.expectedSha) {
    args.shaRetries = 1;
  }
  return args;
}

const FETCH_TIMEOUT_MS = 20_000;

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "chaya-smoke-check/1.0" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const body = await res.text();
  return { res, body };
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "user-agent": "chaya-smoke-check/1.0", accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const body = await res.text();
  let json = null;
  try {
    json = JSON.parse(body);
  } catch {
    // ignore
  }
  return { res, body, json };
}

function ok(label, detail) {
  console.log(`PASS ${label}: ${detail}`);
}

function fail(label, detail) {
  console.error(`FAIL ${label}: ${detail}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const { base, tenant, expectedSha, shaRetries, shaRetryDelayMs } = parseArgs(
    process.argv.slice(2),
  );
  let failed = false;

  const root = base.replace(/\/+$/, "");
  const healthUrl = `${root}/health`;
  const robotsUrl = `${root}/robots.txt`;
  const tenantUrl = `${root}/t/${encodeURIComponent(tenant)}`;
  const ordersHubUrl = `${root}/t/${encodeURIComponent(tenant)}/orders`;
  const cartUrl = `${root}/t/${encodeURIComponent(tenant)}/cart`;
  const barrierFreeUrl = `${root}/t/${encodeURIComponent(tenant)}/barrier-free`;
  const paymentGetUrl = `${root}/t/${encodeURIComponent(tenant)}/checkout/payment`;
  const staffCallGetUrl = `${root}/t/${encodeURIComponent(tenant)}/staff-call`;

  // 1) /health (expected SHA일 때 Vercel 프로덕션 전파 지연을 고려해 재시도)
  try {
    let healthDone = false;
    for (let attempt = 1; attempt <= shaRetries && !healthDone; attempt += 1) {
      const { res, body } = await fetchText(healthUrl);
      if (!res.ok) {
        fail("/health status", `${res.status}`);
        failed = true;
        healthDone = true;
        break;
      }
      const payload = JSON.parse(body);
      if (payload?.ok === true) {
        ok("/health ok", "ok=true");
      } else {
        fail("/health ok", "ok!=true");
        failed = true;
        healthDone = true;
        break;
      }
      if (payload?.supabase?.configured === true) {
        ok("/health supabase", "configured=true");
      } else {
        fail("/health supabase", "configured!=true");
        failed = true;
        healthDone = true;
        break;
      }
      const liveSha = String(payload?.deployment?.gitCommitSha ?? "").toLowerCase();
      if (expectedSha) {
        if (liveSha.startsWith(expectedSha)) {
          ok("/health deployment SHA", `${liveSha.slice(0, 12)} matches ${expectedSha}`);
          healthDone = true;
        } else if (attempt < shaRetries) {
          console.log(
            `RETRY /health deployment SHA (attempt ${attempt}/${shaRetries}): live=${liveSha || "(empty)"} expected=${expectedSha} — wait ${shaRetryDelayMs}ms`,
          );
          await sleep(shaRetryDelayMs);
        } else {
          fail("/health deployment SHA", `live=${liveSha || "(empty)"} expected=${expectedSha}`);
          failed = true;
          healthDone = true;
        }
      } else if (liveSha) {
        ok("/health deployment SHA", liveSha.slice(0, 12));
        healthDone = true;
      } else {
        ok("/health deployment SHA", "SKIP (no deployment.gitCommitSha — 로컬/미설정 빌드일 수 있음)");
        healthDone = true;
      }
    }
  } catch (e) {
    fail("/health request", e instanceof Error ? e.message : String(e));
    failed = true;
  }

  // 2) /robots.txt
  try {
    const { res, body } = await fetchText(robotsUrl);
    if (!res.ok) {
      fail("/robots.txt status", `${res.status}`);
      failed = true;
    } else {
      const hasMDisallow = /disallow:\s*\/m\/?/i.test(body);
      if (hasMDisallow) {
        ok("/robots.txt", "contains disallow /m");
      } else {
        fail("/robots.txt", "missing disallow /m");
        failed = true;
      }
    }
  } catch (e) {
    fail("/robots.txt request", e instanceof Error ? e.message : String(e));
    failed = true;
  }

  // 3) Tenant menu page basic marker
  try {
    const { res, body } = await fetchText(tenantUrl);
    if (!res.ok) {
      fail("/t/{tenant} status", `${res.status}`);
      failed = true;
    } else {
      const hasMarker =
        body.includes("메뉴판") || body.includes("목록형 메뉴") || body.includes("Self-Bar Location");
      if (hasMarker) {
        ok("/t/{tenant} marker", "menu page content detected");
      } else {
        fail("/t/{tenant} marker", "expected marker text not found");
        failed = true;
      }
    }
  } catch (e) {
    fail("/t/{tenant} request", e instanceof Error ? e.message : String(e));
    failed = true;
  }

  // 4) Guest orders hub (SSR shell marker — 손님 주문 허브 라우트)
  try {
    const { res, body } = await fetchText(ordersHubUrl);
    if (!res.ok) {
      fail("/t/{tenant}/orders status", `${res.status}`);
      failed = true;
    } else if (body.includes("주문 현황")) {
      ok("/t/{tenant}/orders", "guest orders hub shell detected");
    } else {
      fail("/t/{tenant}/orders", "expected 「주문 현황」 not found");
      failed = true;
    }
  } catch (e) {
    fail("/t/{tenant}/orders request", e instanceof Error ? e.message : String(e));
    failed = true;
  }

  // 5) Cart page (SSR — 주문 제출 직전 동선)
  try {
    const { res, body } = await fetchText(cartUrl);
    if (!res.ok) {
      fail("/t/{tenant}/cart status", `${res.status}`);
      failed = true;
    } else if (body.includes("주문 확인")) {
      ok("/t/{tenant}/cart", "checkout shell detected");
    } else {
      fail("/t/{tenant}/cart", "expected 「주문 확인」 not found");
      failed = true;
    }
  } catch (e) {
    fail("/t/{tenant}/cart request", e instanceof Error ? e.message : String(e));
    failed = true;
  }

  // 6) Barrier-free list menu (SSR)
  try {
    const { res, body } = await fetchText(barrierFreeUrl);
    if (!res.ok) {
      fail("/t/{tenant}/barrier-free status", `${res.status}`);
      failed = true;
    } else if (body.includes("목록형 메뉴")) {
      ok("/t/{tenant}/barrier-free", "barrier-free shell detected");
    } else {
      fail("/t/{tenant}/barrier-free", "expected 「목록형 메뉴」 not found");
      failed = true;
    }
  } catch (e) {
    fail("/t/{tenant}/barrier-free request", e instanceof Error ? e.message : String(e));
    failed = true;
  }

  // 7–8) Future-feature routes: GET must stay idempotent (405), no state change
  for (const [label, url] of [
    ["GET /t/.../checkout/payment", paymentGetUrl],
    ["GET /t/.../staff-call", staffCallGetUrl],
  ]) {
    try {
      const { res, json } = await fetchJson(url);
      if (res.status !== 405) {
        fail(label, `expected status 405, got ${res.status}`);
        failed = true;
      } else if (json?.error === "Method Not Allowed") {
        ok(label, "405 Method Not Allowed (GET safe)");
      } else {
        fail(label, `expected JSON error "Method Not Allowed", got ${JSON.stringify(json)}`);
        failed = true;
      }
    } catch (e) {
      fail(`${label} request`, e instanceof Error ? e.message : String(e));
      failed = true;
    }
  }

  if (failed) {
    process.exitCode = 1;
    console.error("Smoke check failed");
    return;
  }
  console.log("Smoke check passed");
}

main();
