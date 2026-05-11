import { useMemo } from "react";

import type { CategoryInput } from "./category-schema";

export function useCategory(items: CategoryInput[]) {
  return useMemo(
    () => items.filter((item) => item.is_active !== false).sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)),
    [items],
  );
}
