import type { AppLocale } from "@/lib/i18n/locales";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import type { ChayaMenuRow } from "@/lib/menus/types";
import { listMenusForTenant } from "@/lib/menus/queries";
import { resolveMenuName } from "@/lib/menus/resolve-menu-text";

import type { GuestOrderLineView, GuestOrderView } from "./fetch-guest-order";
import type { GuestOrderListItem } from "./list-guest-orders";

function resolveLinesWithCatalog(
  lines: GuestOrderLineView[],
  locale: AppLocale,
  byId: Map<string, ChayaMenuRow>,
): GuestOrderLineView[] {
  if (locale === DEFAULT_LOCALE || lines.length === 0 || byId.size === 0) return lines;

  return lines.map((line) => {
    if (!line.menuId) return line;
    const row = byId.get(line.menuId);
    if (!row) return line;
    return { ...line, name: resolveMenuName(row, locale) };
  });
}

async function menuRowsByIdForOrderLines(
  tenant: string,
  orders: GuestOrderListItem[],
): Promise<Map<string, ChayaMenuRow>> {
  const menuIds = new Set<string>();
  for (const order of orders) {
    for (const line of order.lines) {
      if (line.menuId) menuIds.add(line.menuId);
    }
  }
  if (menuIds.size === 0) return new Map();

  const catalog = await listMenusForTenant(tenant);
  if (!catalog.ok) return new Map();

  return new Map(catalog.items.filter((row) => menuIds.has(row.id)).map((row) => [row.id, row]));
}

export async function resolveOrderLinesForLocale(
  tenant: string,
  lines: GuestOrderLineView[],
  locale: AppLocale,
): Promise<GuestOrderLineView[]> {
  if (locale === DEFAULT_LOCALE || lines.length === 0) return lines;

  const menuIds = [...new Set(lines.map((l) => l.menuId).filter((id): id is string => !!id))];
  if (menuIds.length === 0) return lines;

  const catalog = await listMenusForTenant(tenant);
  if (!catalog.ok) return lines;

  const byId = new Map(catalog.items.filter((row) => menuIds.includes(row.id)).map((row) => [row.id, row]));
  return resolveLinesWithCatalog(lines, locale, byId);
}

export async function resolveGuestOrderViewForLocale(
  tenant: string,
  order: GuestOrderView,
  locale: AppLocale,
): Promise<GuestOrderView> {
  const lines = await resolveOrderLinesForLocale(tenant, order.lines, locale);
  return lines === order.lines ? order : { ...order, lines };
}

export async function resolveGuestOrderListForLocale(
  tenant: string,
  orders: GuestOrderListItem[],
  locale: AppLocale,
): Promise<GuestOrderListItem[]> {
  if (locale === DEFAULT_LOCALE || orders.length === 0) return orders;

  const byId = await menuRowsByIdForOrderLines(tenant, orders);
  if (byId.size === 0) return orders;

  return orders.map((order) => {
    const lines = resolveLinesWithCatalog(order.lines, locale, byId);
    return lines === order.lines ? order : { ...order, lines };
  });
}
