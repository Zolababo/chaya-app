#!/usr/bin/env node

/**
 * Validate merchant cutover checklist markdown.
 * Usage:
 *   node ./scripts/check-merchant-cutover-readiness.mjs --file docs/merchant-validation-demo-20260506.md
 */

import { readFile } from "node:fs/promises";

function parseArgs(argv) {
  const args = {
    file: "docs/merchant-validation-demo-20260506.md",
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if ((token === "--file" || token === "-f") && argv[i + 1]) {
      args.file = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function collectUncheckedCutoverItems(text) {
  const lines = text.split(/\r?\n/);
  const startIdx = lines.findIndex((line) => line.trim() === "## D. 컷오버 판단");
  if (startIdx < 0) return ["섹션 `## D. 컷오버 판단` 없음"];

  const unchecked = [];
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (line.startsWith("## ")) break;
    if (line.startsWith("- [ ]")) {
      unchecked.push(line.replace("- [ ]", "").trim());
    }
  }
  return unchecked;
}

function countFilledOrderRows(text) {
  const lines = text.split(/\r?\n/);
  return lines.filter((line) => {
    if (!line.trim().startsWith("| 2026-")) return false;
    if (!line.includes("pending->accepted") && !line.includes("accepted->preparing") && !line.includes("preparing->ready") && !line.includes("ready->completed")) {
      return false;
    }
    const cells = line.split("|").map((v) => v.trim());
    const orderId = cells[3] ?? "";
    return orderId.length > 0;
  }).length;
}

async function main() {
  const { file } = parseArgs(process.argv.slice(2));
  const text = await readFile(file, "utf8");

  const unchecked = collectUncheckedCutoverItems(text);
  const filledOrderRows = countFilledOrderRows(text);

  console.log(`Cutover readiness check: ${file}`);
  console.log(`Filled order rows: ${filledOrderRows}`);

  if (unchecked.length > 0) {
    console.log("Pending cutover checklist items:");
    for (const item of unchecked) {
      console.log(`- ${item}`);
    }
  }

  if (unchecked.length > 0 || filledOrderRows < 3) {
    if (filledOrderRows < 3) {
      console.log("- 주문 행 기록이 부족합니다 (최소 3건 권장).");
    }
    process.exitCode = 1;
    return;
  }

  console.log("Cutover readiness: PASS");
}

main().catch((error) => {
  console.error("Cutover readiness check failed:", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
