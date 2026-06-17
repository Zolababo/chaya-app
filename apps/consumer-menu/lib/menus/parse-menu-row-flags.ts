export function parseMenuSoldOut(raw: Record<string, unknown>): boolean {
  const flag = raw.is_sold_out ?? raw.isSoldOut;
  return flag === true || flag === "true" || flag === "t" || flag === 1 || flag === "1";
}

export function parseMenuMerchandisingFlags(raw: Record<string, unknown>): {
  isTodaysPick: boolean;
  isStoreRecommended: boolean;
} {
  const todays = raw.is_todays_pick ?? raw.isTodaysPick;
  const store = raw.is_store_recommended ?? raw.isStoreRecommended;
  return {
    isTodaysPick: todays === true || todays === "true" || todays === "t" || todays === 1 || todays === "1",
    isStoreRecommended:
      store === true || store === "true" || store === "t" || store === 1 || store === "1",
  };
}
