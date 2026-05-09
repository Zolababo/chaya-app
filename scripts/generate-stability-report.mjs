#!/usr/bin/env node

/**
 * Generate stability report markdown by executing smoke/check scripts.
 * - Always writes a report file.
 * - Exits non-zero if consumer or merchant smoke fails.
 * - Cutover readiness can be pending without failing the report command.
 */

import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";

function parseArgs(argv) {
  const args = {
    tenant: "demo",
    checklistFile: "docs/merchant-validation-demo-20260506.md",
    outFile: "docs/STABILITY_REPORT.md",
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
  }
  return args;
}

function runNode(scriptPath, args) {
  return new Promise((resolve) => {
    let stdout = "";
    let stderr = "";
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (d) => {
      stdout += String(d);
    });
    child.stderr.on("data", (d) => {
      stderr += String(d);
    });
    child.on("exit", (code) => {
      resolve({
        ok: code === 0,
        code: code ?? 1,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
      });
    });
  });
}

function section(name, result, required) {
  const status = result.ok ? "PASS" : required ? "FAIL" : "PENDING";
  const body = [result.stdout, result.stderr].filter(Boolean).join("\n");
  return `## ${name}: ${status}

\`\`\`
${body || "(no output)"}
\`\`\`
`;
}

async function main() {
  const { tenant, checklistFile, outFile } = parseArgs(process.argv.slice(2));
  const now = new Date().toISOString();

  const consumer = await runNode("./scripts/smoke-consumer-menu.mjs", ["--tenant", tenant]);
  const merchant = await runNode("./scripts/smoke-merchant-parallel.mjs", [
    "--tenant",
    tenant,
    "--retries",
    "5",
    "--retry-delay-ms",
    "5000",
  ]);
  const a11y = await runNode("./scripts/check-a11y-baseline.mjs", ["--tenant", tenant]);
  const cutover = await runNode("./scripts/check-merchant-cutover-readiness.mjs", [
    "--file",
    checklistFile,
  ]);

  const report = `# Stability Report

- Generated at: ${now}
- Tenant: ${tenant}
- Checklist file: \`${checklistFile}\`

${section("Consumer Smoke", consumer, true)}
${section("Merchant Parallel Smoke", merchant, true)}
${section("A11y Baseline", a11y, true)}
${section("Cutover Readiness", cutover, false)}
`;

  const outDir = outFile.includes("/") ? outFile.slice(0, outFile.lastIndexOf("/")) : ".";
  await mkdir(outDir, { recursive: true });
  await writeFile(outFile, report, "utf8");
  console.log(`Wrote ${outFile}`);

  if (!consumer.ok || !merchant.ok || !a11y.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Failed to generate stability report:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
