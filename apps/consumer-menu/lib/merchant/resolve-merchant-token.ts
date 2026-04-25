import { cookies } from "next/headers";

import { MERCHANT_TOKEN_COOKIE } from "./constants";
import { verifyMerchantToken } from "./verify-token";

/**
 * 쿠키(httpOnly) 또는 URL `?token=` 중 하나라도 유효하면 토큰 문자열을 반환합니다.
 * (첫 방문 시 `?token=` 으로 들어오면 middleware 가 쿠키를 심고 URL 에서 token 을 제거합니다.)
 */
export async function resolveMerchantToken(urlToken: string | undefined): Promise<string | null> {
  const jar = await cookies();
  const fromCookie = jar.get(MERCHANT_TOKEN_COOKIE)?.value;
  if (verifyMerchantToken(fromCookie)) {
    return String(fromCookie).trim();
  }
  if (verifyMerchantToken(urlToken)) {
    return String(urlToken).trim();
  }
  return null;
}
