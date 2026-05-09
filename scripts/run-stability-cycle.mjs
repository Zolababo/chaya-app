#!/usr/bin/env node

/**
 * Run full stability cycle in one command.
 * 1) platform smoke
 * 2) stability report generation
 * 3) optional strict cutover gate
 */

import { spawn } from "node:child_process";

function parseArgs(argv) {
  const args = {
    tenant: "demo",
    checklistFile: "docs/merchant-validation-demo-20260506.md",
    outFile: "docs/STABILITY_REPORT.md",
    strictCutover: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if ((token === "--tenant" || token === "-t") && argv[i + 1]) {
      args.tenant = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--checklist-file" && argv[i + 1]) {
      args.checklistFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--out-file" && argv[i + 1]) {
      args.outFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (token === "--strict-cutover") {
      args.strictCutover = true;
    }
  }
  return args;
}

function runNode(scriptPath, args, { required = true } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], { stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      const ok = code === 0;
      if (ok || !required) resolve({ ok, code: code ?? 1 });
      else reject(new Error(`${scriptPath} failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function main() {
  const { tenant, checklistFile, outFile, strictCutover } = parseArgs(process.argv.slice(2));
  console.log(`Stability cycle start (tenant=${tenant})`);

  await runNode("./scripts/smoke-platform.mjs", [
    "--tenant",
    tenant,
    "--merchant-retries",
    "5",
    "--merchant-retry-delay-ms",
    "5000",
  ]);

  await runNode("./scripts/check-a11y-baseline.mjs", ["--tenant", tenant]);

  await runNode("./scripts/generate-stability-report.mjs", [
    "--tenant",
    tenant,
    "--checklist-file",
    checklistFile,
    "--out-file",
    outFile,
  ]);

  await runNode(
    "./scripts/check-merchant-cutover-readiness.mjs",
    ["--file", checklistFile],
    { required: strictCutover },
  );

  if (!strictCutover) {
    console.log("Cutover readiness is advisory in non-strict mode.");
  }
  console.log("Stability cycle completed");
}

main().catch((error) => {
  console.error("Stability cycle failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
