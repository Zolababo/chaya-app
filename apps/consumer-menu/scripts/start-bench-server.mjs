import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    process.env[t.slice(0, i)] = t.slice(i + 1).replace(/^"|"$/g, "");
  }
}

loadEnv(resolve(root, ".env.prod-root"));
loadEnv(resolve(root, ".env.production.local"));
process.env.CHAYA_MERCHANT_BENCH = "1";
process.env.CHAYA_BENCH_SECRET = process.env.CHAYA_BENCH_SECRET || "chaya-bench-local";

const child = spawn("npm", ["run", "start", "--", "-p", "3098"], {
  cwd: root,
  env: process.env,
  stdio: "inherit",
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
