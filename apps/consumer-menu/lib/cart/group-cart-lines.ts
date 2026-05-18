import { sortCategoryNames } from "@/lib/menus/category-order";

import type { CartLine } from "./local-cart";
import { cartLineKey } from "./local-cart";

export type CartLineGroup = {
  category: string;
  lines: CartLine[];
};

const DEFAULT_CATEGORY = "기타";

function categoryOf(line: CartLine): string {
  return line.category?.trim() || DEFAULT_CATEGORY;
}

/** 메뉴판 카테고리 순서에 맞춰 장바구니 행을 묶습니다. */
export function groupCartLines(lines: CartLine[], categoryOrder: string[]): CartLineGroup[] {
  const byCat = new Map<string, CartLine[]>();
  for (const line of lines) {
    const cat = categoryOf(line);
    const bucket = byCat.get(cat) ?? [];
    bucket.push(line);
    byCat.set(cat, bucket);
  }

  for (const bucket of byCat.values()) {
    bucket.sort(
      (a, b) =>
        a.sortOrder - b.sortOrder ||
        a.name.localeCompare(b.name, "ko") ||
        cartLineKey(a.id, a.selectedOptions).localeCompare(cartLineKey(b.id, b.selectedOptions)),
    );
  }

  const orderedKeys: string[] = [];
  for (const cat of sortCategoryNames(categoryOrder)) {
    if (byCat.has(cat)) orderedKeys.push(cat);
  }
  for (const cat of sortCategoryNames([...byCat.keys()])) {
    if (!orderedKeys.includes(cat)) orderedKeys.push(cat);
  }

  return orderedKeys.map((category) => ({
    category,
    lines: byCat.get(category) ?? [],
  }));
}
