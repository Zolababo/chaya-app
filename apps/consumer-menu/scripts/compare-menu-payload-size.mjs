#!/usr/bin/env node
/**
 * translations_json 포함 여부에 따른 RSC props 페이로드 크기 비교
 * Usage: node scripts/compare-menu-payload-size.mjs [tenant]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i <= 0) continue;
    const key = t.slice(0, i);
    let val = t.slice(i + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (val && process.env[key] == null) process.env[key] = val;
  }
}

for (const p of [
  resolve(root, ".env.local"),
  resolve(root, ".env.production.local"),
  resolve(root, ".env.vercel-prod-cm"),
]) {
  loadEnv(p);
}

const tenant = process.argv[2] || "demo";

async function fetchMenuRows(select) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL/ANON_KEY required in .env.local");
  }
  const q = new URL(`${url}/rest/v1/ChayaMenus`);
  q.searchParams.set("select", select);
  q.searchParams.set("tenant_slug", `eq.${tenant}`);
  q.searchParams.set("order", "sort_order.asc.nullslast,name.asc");
  const res = await fetch(q, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function slimBoardRowBefore(raw) {
  return {
    id: String(raw.id),
    name: raw.name,
    description: raw.description ?? null,
    price: Number(raw.price),
    category: raw.category ?? null,
    imageUrl: raw.imageUrl ?? null,
    sortOrder: raw.sort_order ?? 0,
    isSoldOut: raw.is_sold_out === true,
    isTodaysPick: raw.is_todays_pick === true,
    isStoreRecommended: raw.is_store_recommended === true,
    createdAt: raw.created_at ?? null,
    optionGroups: [],
    translations: {},
    translationSource: null,
    spiceLevel: null,
  };
}

function parseTranslations(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (k === "_meta" || !v || typeof v !== "object") continue;
    out[k] = v;
  }
  return out;
}

function resolvedRowOnly(raw, locale = "en") {
  const tr = parseTranslations(raw.translations_json);
  const base = slimBoardRowBefore(raw);
  if (locale === "ko") return base;
  const t = tr[locale];
  return {
    ...base,
    name: t?.name?.trim() || base.name,
    description: t?.description?.trim() || base.description,
    category: t?.category?.trim() || base.category,
    translations: {},
  };
}

const BASE_SELECT =
  "id,name,description,price,category,imageUrl,sort_order,is_sold_out,is_todays_pick,is_store_recommended,created_at";
const WITH_TR = `${BASE_SELECT},translations_json`;

const rows = await fetchMenuRows(WITH_TR);

const beforeItems = rows.map(slimBoardRowBefore);
const afterItems = rows.map((r) => ({
  ...slimBoardRowBefore(r),
  translations: parseTranslations(r.translations_json),
}));
const resolvedEnItems = rows.map((r) => resolvedRowOnly(r, "en"));
const resolvedKoItems = rows.map((r) => resolvedRowOnly(r, "ko"));

const categories = [...new Set(rows.map((r) => r.category?.trim() || "기타"))];

const clientPropsBefore = { tenant, items: beforeItems, categories };
const clientPropsAfter = { tenant, items: afterItems, categories };
const clientPropsResolvedEn = { tenant, items: resolvedEnItems, categories };

function kb(obj) {
  return Math.round(JSON.stringify(obj).length / 1024);
}

const translationsOnlyBytes = rows.reduce((n, r) => {
  const tr = parseTranslations(r.translations_json);
  return n + JSON.stringify(tr).length;
}, 0);

console.log(
  JSON.stringify(
    {
      tenant,
      menuCount: rows.length,
      localeCountInDb: {
        note: "translations_json 키 per item (샘플 첫 3개)",
        samples: rows.slice(0, 3).map((r) => Object.keys(parseTranslations(r.translations_json))),
      },
      serializedBytes: {
        note: "MenuHomeDeferredClient props JSON.stringify 길이",
        beforeFix_noTranslations: {
          bytes: JSON.stringify(clientPropsBefore).length,
          kb: kb(clientPropsBefore),
        },
        afterFix_allTranslations: {
          bytes: JSON.stringify(clientPropsAfter).length,
          kb: kb(clientPropsAfter),
        },
        proposed_serverResolvedEn: {
          bytes: JSON.stringify(clientPropsResolvedEn).length,
          kb: kb(clientPropsResolvedEn),
        },
        proposed_serverResolvedKo: {
          bytes: JSON.stringify({ tenant, items: resolvedKoItems, categories }).length,
          kb: kb({ tenant, items: resolvedKoItems, categories }),
        },
      },
      delta: {
        afterMinusBeforeKb: kb(clientPropsAfter) - kb(clientPropsBefore),
        afterMinusBeforePct: Math.round(
          ((JSON.stringify(clientPropsAfter).length - JSON.stringify(clientPropsBefore).length) /
            JSON.stringify(clientPropsBefore).length) *
            100,
        ),
        translationsJsonTotalKb: Math.round(translationsOnlyBytes / 1024),
        resolvedEnSavesKb: kb(clientPropsAfter) - kb(clientPropsResolvedEn),
      },
    },
    null,
    2,
  ),
);
