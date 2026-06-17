export type OrderLineSummary = { name: string; quantity: number };

function coerceItemsArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** orders.items JSON → 요약용 라인. */
export function parseOrderLineSummaries(raw: unknown): OrderLineSummary[] {
  const out: OrderLineSummary[] = [];
  for (const row of coerceItemsArray(raw)) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const name =
      typeof o.name === "string"
        ? o.name.trim()
        : typeof o.menu_name === "string"
          ? o.menu_name.trim()
          : "";
    if (!name) continue;
    const qty = num(o.quantity) ?? num(o.qty) ?? 1;
    out.push({ name, quantity: Math.max(1, Math.floor(qty)) });
  }
  return out;
}

/** 티켓 카드용 1~2줄 + `외 N개`. */
export function formatOrderLinesPreview(
  lines: OrderLineSummary[],
  maxLines = 2,
): { text: string; extraCount: number } {
  if (lines.length === 0) return { text: "", extraCount: 0 };
  const shown = lines.slice(0, maxLines);
  const text = shown.map((l) => `${l.name} ×${l.quantity}`).join(", ");
  const extraCount = Math.max(0, lines.length - maxLines);
  return { text, extraCount };
}
