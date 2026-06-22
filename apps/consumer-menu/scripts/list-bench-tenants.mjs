import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i <= 0) continue;
      process.env[t.slice(0, i)] = t.slice(i + 1).replace(/^"|"$/g, "");
    }
  } catch {
    /* ignore */
  }
}

loadEnv(resolve(root, ".env.prod-root"));
loadEnv(resolve(root, ".env.production.local"));
loadEnv(resolve(root, ".env.local"));

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) {
  console.log(JSON.stringify({ error: "no supabase env" }));
  process.exit(1);
}

const res = await fetch(
  `${url}/rest/v1/merchant_tenant_members?select=tenant_slug&approved_at=not.is.null&order=tenant_slug&limit=5`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } },
);
const rows = await res.json();
console.log(JSON.stringify(rows, null, 2));

const slug = rows?.[0]?.tenant_slug ?? "demo";
const oc = await fetch(
  `${url}/rest/v1/orders?tenant_slug=eq.${encodeURIComponent(slug)}&select=id`,
  { headers: { apikey: key, Authorization: `Bearer ${key}`, Prefer: "count=exact" }, method: "HEAD" },
);
console.log(JSON.stringify({ tenant: slug, orderCountHeader: oc.headers.get("content-range") }));
