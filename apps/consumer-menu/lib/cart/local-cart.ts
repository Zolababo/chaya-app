import type { ChayaMenuRow } from "@/lib/menus/types";

export type CartLine = ChayaMenuRow & { quantity: number; notes: string | null };

const PREFIX = "chaya_cart_v1:";

function storageKey(tenant: string): string {
  return `${PREFIX}${encodeURIComponent(tenant.trim())}`;
}

function parseLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  const price = typeof o.price === "number" ? o.price : Number(o.price);
  const quantity = typeof o.quantity === "number" ? o.quantity : Number(o.quantity);
  if (!Number.isFinite(price) || !Number.isFinite(quantity)) return null;
  const q = Math.floor(quantity);
  if (q < 1 || q > 99) return null;
  const notes = o.notes;
  return {
    id: o.id,
    name: o.name,
    price,
    quantity: q,
    notes: typeof notes === "string" && notes.trim() ? notes : null,
    description: typeof o.description === "string" ? o.description : null,
    category: typeof o.category === "string" ? o.category : null,
    imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : null,
  };
}

export function readCart(tenant: string): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(tenant));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const lines: CartLine[] = [];
    for (const row of parsed) {
      const line = parseLine(row);
      if (line) lines.push(line);
    }
    return lines;
  } catch {
    return [];
  }
}

export function writeCart(tenant: string, lines: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    if (lines.length === 0) {
      localStorage.removeItem(storageKey(tenant));
      return;
    }
    localStorage.setItem(storageKey(tenant), JSON.stringify(lines));
  } catch {
    /* quota / private mode */
  }
}

export function clearCart(tenant: string): void {
  writeCart(tenant, []);
}

/** 같은 메뉴 id 면 수량 합산(최대 99). */
export function addLine(
  tenant: string,
  item: ChayaMenuRow,
  quantity: number,
  notes: string | null,
): CartLine[] {
  const q = Math.max(1, Math.min(99, Math.floor(quantity)));
  const lines = readCart(tenant);
  const idx = lines.findIndex((l) => l.id === item.id);
  let next: CartLine[];
  if (idx === -1) {
    next = [
      ...lines,
      {
        ...item,
        quantity: q,
        notes: notes?.trim() ? notes.trim() : null,
      },
    ];
  } else {
    const merged = Math.min(99, lines[idx].quantity + q);
    next = lines.map((l, i) =>
      i === idx ? { ...l, quantity: merged, notes: notes?.trim() ? notes.trim() : l.notes } : l,
    );
  }
  writeCart(tenant, next);
  return next;
}
