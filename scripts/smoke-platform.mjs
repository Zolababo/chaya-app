#!/usr/bin/env node

/**
 * Platform smoke checks (consumer + merchant).
 * Runs both smoke scripts sequentially and fails fast.
 */

import { spawn } from "node:child_process";

function parseArgs(argv) {
  const args = {
    tenant: "demo",
    expectedSha: "",
    greenBase: "",
    blueBase: "",
    merchantRetries: "",
    merchantRetryDelayMs: "",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if ((token === "--tenant" || token === "-t") && argv[i + 1]) {
      args.tenant = argv[i + 1];
      i += 1;
      continue;
    }
    if ((token === "--expected-sha" || token === "-s") && argv[i + 1]) {
      args.expectedSha = argv[i + 1];
      i += 1;
      continue;
    }
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
    if (token === "--merchant-retries" && argv[i + 1]) {
      args.merchantRetries = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--merchant-retry-delay-ms" && argv[i + 1]) {
      args.merchantRetryDelayMs = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return args;
}

function runNodeScript(scriptPath, scriptArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...scriptArgs], {
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${scriptPath} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  const { tenant, expectedSha, greenBase, blueBase, merchantRetries, merchantRetryDelayMs } = parseArgs(
    process.argv.slice(2),
  );
  console.log(`Platform smoke start (tenant=${tenant})`);

  const consumerArgs = ["--tenant", tenant];
  if (expectedSha) {
    consumerArgs.push("--expected-sha", expectedSha);
  }
  await runNodeScript("./scripts/smoke-consumer-menu.mjs", consumerArgs);

  const merchantArgs = ["--tenant", tenant];
  if (greenBase) merchantArgs.push("--green-base", greenBase);
  if (blueBase) merchantArgs.push("--blue-base", blueBase);
  if (merchantRetries) merchantArgs.push("--retries", merchantRetries);
  if (merchantRetryDelayMs) merchantArgs.push("--retry-delay-ms", merchantRetryDelayMs);
  await runNodeScript("./scripts/smoke-merchant-parallel.mjs", merchantArgs);

  console.log("Platform smoke passed");
}

main().catch((error) => {
  console.error("Platform smoke failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
