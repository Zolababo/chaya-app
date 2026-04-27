"use server";

import { fetchGuestOrderStatusOnly } from "./fetch-guest-order-status";

/** 주문 상세에서 상태 배지만 갱신할 때 사용 (전체 RSC 새로고침 없이). */
export async function fetchGuestOrderStatusAction(
  tenant: string,
  orderId: string,
): Promise<{ ok: true; status: string } | { ok: false }> {
  const status = await fetchGuestOrderStatusOnly(tenant, orderId);
  if (status == null) return { ok: false };
  return { ok: true, status };
}
