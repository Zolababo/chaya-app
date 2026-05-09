import { timingSafeEqualUtf8 } from "./secure-compare";

/** `MERCHANT_ORDERS_TOKEN` 과 비교(타이밍 안전). 쿠키·URL 토큰 검증에 공통 사용. */
export function verifyMerchantToken(token: string | undefined | null): boolean {
  const expected = process.env.MERCHANT_ORDERS_TOKEN?.trim();
  if (!expected || token == null) return false;
  const got = String(token).trim();
  return timingSafeEqualUtf8(expected, got);
}
