import type { SelectedMenuOption } from "@/lib/menus/menu-options";
import { parseMenuOptionGroups, selectedOptionsPriceDelta } from "@/lib/menus/menu-options";
import type { ChayaMenuRow } from "@/lib/menus/types";

export type CartLine = ChayaMenuRow & {
  quantity: number;
  notes: string | null;
  selectedOptions: SelectedMenuOption[];
  /** 기본 가격 + 옵션 추가금 */
  unitPrice: number;
};

const PREFIX = "chaya_cart_v1:";

export const CHAYA_CART_CHANGED_EVENT = "chaya-cart-changed";

function storageKey(tenant: string): string {
  return `${PREFIX}${encodeURIComponent(tenant.trim())}`;
}

export function cartLineKey(id: string, selected: SelectedMenuOption[]): string {
  const part = selected
    .map((s) => `${s.groupId}:${s.choiceId}`)
    .sort()
    .join(",");
  return `${id}::${part}`;
}

let cartNotifyTimer: ReturnType<typeof setTimeout> | null = null;
let cartNotifyTenant = "";

function scheduleCartChanged(tenant: string): void {
  if (typeof window === "undefined") return;
  const slug = tenant.trim();
  cartNotifyTenant = slug;
  if (cartNotifyTimer) clearTimeout(cartNotifyTimer);
  cartNotifyTimer = setTimeout(() => {
    cartNotifyTimer = null;
    window.dispatchEvent(
      new CustomEvent(CHAYA_CART_CHANGED_EVENT, { detail: { tenant: cartNotifyTenant } }),
    );
  }, 48);
}

function parseSelectedOptions(raw: unknown): SelectedMenuOption[] {
  if (!Array.isArray(raw)) return [];
  const out: SelectedMenuOption[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    if (
      typeof o.groupId === "string" &&
      typeof o.groupName === "string" &&
      typeof o.choiceId === "string" &&
      typeof o.choiceLabel === "string"
    ) {
      const pd = typeof o.priceDelta === "number" ? o.priceDelta : Number(o.priceDelta);
      out.push({
        groupId: o.groupId,
        groupName: o.groupName,
        choiceId: o.choiceId,
        choiceLabel: o.choiceLabel,
        priceDelta: Number.isFinite(pd) ? pd : 0,
      });
    }
  }
  return out;
}

function parseLine(raw: unknown): CartLine | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== "string" || typeof o.name !== "string") return null;
  const basePrice = typeof o.price === "number" ? o.price : Number(o.price);
  const quantity = typeof o.quantity === "number" ? o.quantity : Number(o.quantity);
  if (!Number.isFinite(basePrice) || !Number.isFinite(quantity)) return null;
  const q = Math.floor(quantity);
  if (q < 1 || q > 99) return null;
  const selectedOptions = parseSelectedOptions(o.selectedOptions);
  const unitPriceRaw = typeof o.unitPrice === "number" ? o.unitPrice : Number(o.unitPrice);
  const unitPrice = Number.isFinite(unitPriceRaw)
    ? unitPriceRaw
    : basePrice + selectedOptionsPriceDelta(selectedOptions);

  const so = o.sortOrder ?? o.sort_order;
  const sortOrder =
    typeof so === "number" ? so : typeof so === "string" ? Number(so) : 0;
  const sortOrderNorm = Number.isFinite(sortOrder) ? Math.trunc(sortOrder) : 0;

  const soldRaw = o.is_sold_out ?? o.isSoldOut;
  const isSoldOut =
    soldRaw === true || soldRaw === "true" || soldRaw === "t" || soldRaw === 1 || soldRaw === "1";

  return {
    id: o.id,
    name: o.name,
    price: basePrice,
    quantity: q,
    notes: typeof o.notes === "string" && o.notes.trim() ? o.notes.trim() : null,
    description: typeof o.description === "string" ? o.description : null,
    category: typeof o.category === "string" ? o.category : null,
    imageUrl: typeof o.imageUrl === "string" ? o.imageUrl : null,
    sortOrder: sortOrderNorm,
    isSoldOut,
    optionGroups: parseMenuOptionGroups(o.optionGroups ?? o.options_json),
    translations: {},
    selectedOptions,
    unitPrice,
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
      scheduleCartChanged(tenant);
      return;
    }
    localStorage.setItem(storageKey(tenant), JSON.stringify(lines));
    scheduleCartChanged(tenant);
  } catch {
    /* quota */
  }
}

export function clearCart(tenant: string): void {
  writeCart(tenant, []);
}

export function addLine(
  tenant: string,
  item: ChayaMenuRow,
  quantity: number,
  notes: string | null,
  selectedOptions: SelectedMenuOption[] = [],
): CartLine[] {
  if (item.isSoldOut) return readCart(tenant);
  const q = Math.max(1, Math.min(99, Math.floor(quantity)));
  const unitPrice = item.price + selectedOptionsPriceDelta(selectedOptions);
  const key = cartLineKey(item.id, selectedOptions);
  const lines = readCart(tenant);
  const idx = lines.findIndex((l) => cartLineKey(l.id, l.selectedOptions) === key);
  const row: CartLine = {
    ...item,
    quantity: q,
    notes: notes?.trim() ? notes.trim() : null,
    selectedOptions,
    unitPrice,
  };
  let next: CartLine[];
  if (idx === -1) {
    next = [...lines, row];
  } else {
    const merged = Math.min(99, lines[idx].quantity + q);
    next = lines.map((l, i) =>
      i === idx
        ? {
            ...l,
            quantity: merged,
            notes: notes?.trim() ? notes.trim() : l.notes,
          }
        : l,
    );
  }
  writeCart(tenant, next);
  return next;
}

export function cartTotalQty(tenant: string): number {
  return readCart(tenant).reduce((sum, line) => sum + line.quantity, 0);
}

export function cartSubtotal(tenant: string): number {
  return readCart(tenant).reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}
