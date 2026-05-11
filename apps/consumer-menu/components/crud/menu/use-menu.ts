import { useMemo } from "react";

import type { MenuInput } from "./menu-schema";

export function useMenu(items: MenuInput[]) {
  const sorted = useMemo(
    () => [...items].sort((a, b) => (a.sort_order ?? Number.MAX_SAFE_INTEGER) - (b.sort_order ?? Number.MAX_SAFE_INTEGER)),
    [items],
  );
  return sorted;
}
