#!/usr/bin/env node

/**
 * Generate certification readiness pack index markdown.
 */

import { access, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";

const REQUIRED_FILES = [
  "docs/BARRIER_FREE_CERT_TRACK.md",
  "docs/BARRIER_FREE_EVIDENCE_TEMPLATE.md",
  "docs/BARRIER_FREE_USER_TEST_LOG.md",
  "docs/STABILITY_REPORT.md",
];

function parseArgs(argv) {
  const args = { strict: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--strict") args.strict = true;
  }
  return args;
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { strict } = parseArgs(process.argv.slice(2));
  const now = new Date().toISOString();
  const statuses = await Promise.all(
    REQUIRED_FILES.map(async (file) => ({
      file,
      ok: await exists(file),
    })),
  );

  let stabilitySummary = "N/A";
  let hasStabilityFailOrPending = false;
  if (await exists("docs/STABILITY_REPORT.md")) {
    const report = await readFile("docs/STABILITY_REPORT.md", "utf8");
    const lines = report
      .split(/\r?\n/)
      .filter((line) => line.startsWith("## "))
      .join(" | ");
    stabilitySummary = lines || "section not found";
    hasStabilityFailOrPending = /## .+:\s*(FAIL|PENDING)\b/.test(report);
  }

  const missing = statuses.filter((s) => !s.ok).map((s) => s.file);
  const checklist = statuses
    .map((s) => `- [${s.ok ? "x" : " "}] \`${s.file}\``)
    .join("\n");

  const needsAction = missing.length > 0 || hasStabilityFailOrPending;
  const out = `# Certification Readiness Pack

- Generated at: ${now}

## Required Evidence Files
${checklist}

## Latest Stability Summary
${stabilitySummary}

## Decision
- ${needsAction ? "PACK_NEEDS_ACTION" : "PACK_READY_FOR_REVIEW"}
${missing.length ? `- Missing: ${missing.join(", ")}` : ""}
${hasStabilityFailOrPending ? "- Stability report includes FAIL/PENDING sections" : ""}
`;

  await writeFile("docs/CERT_READINESS_PACK.md", out, "utf8");
  console.log("Wrote docs/CERT_READINESS_PACK.md");
  if (strict && needsAction) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Failed to generate cert readiness pack:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
