#!/usr/bin/env node

/**
 * Consumer menu production smoke checks.
 * - Verifies /health payload basics
 * - Optionally compares deployment.gitCommitSha to expected SHA
 * - Verifies robots disallow for /m paths
 * - Verifies tenant page responds with menu marker text
 */

const DEFAULT_BASE_URL = "https://chaya-app.vercel.app";

function parseArgs(argv) {
  const args = { base: DEFAULT_BASE_URL, tenant: "demo", expectedSha: "" };
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

function ok(label, detail) {
  console.log(`PASS ${label}: ${detail}`);
}

function fail(label, detail) {
  console.error(`FAIL ${label}: ${detail}`);
}

async function main() {
  const { base, tenant, expectedSha } = parseArgs(process.argv.slice(2));
  let failed = false;

  const root = base.replace(/\/+$/, "");
  const healthUrl = `${root}/health`;
  const robotsUrl = `${root}/robots.txt`;
  const tenantUrl = `${root}/t/${encodeURIComponent(tenant)}`;

  // 1) /health
  try {
    const { res, body } = await fetchText(healthUrl);
    if (!res.ok) {
      fail("/health status", `${res.status}`);
      failed = true;
    } else {
      const payload = JSON.parse(body);
      if (payload?.ok === true) {
        ok("/health ok", "ok=true");
      } else {
        fail("/health ok", "ok!=true");
        failed = true;
      }
      if (payload?.supabase?.configured === true) {
        ok("/health supabase", "configured=true");
      } else {
        fail("/health supabase", "configured!=true");
        failed = true;
      }
      const liveSha = String(payload?.deployment?.gitCommitSha ?? "").toLowerCase();
      if (expectedSha) {
        if (liveSha.startsWith(expectedSha)) {
          ok("/health deployment SHA", `${liveSha.slice(0, 12)} matches ${expectedSha}`);
        } else {
          fail("/health deployment SHA", `live=${liveSha || "(empty)"} expected=${expectedSha}`);
          failed = true;
        }
      } else if (liveSha) {
        ok("/health deployment SHA", liveSha.slice(0, 12));
      } else {
        ok("/health deployment SHA", "SKIP (no deployment.gitCommitSha — 로컬/미설정 빌드일 수 있음)");
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

  if (failed) {
    process.exitCode = 1;
    console.error("Smoke check failed");
    return;
  }
  console.log("Smoke check passed");
}

main();
