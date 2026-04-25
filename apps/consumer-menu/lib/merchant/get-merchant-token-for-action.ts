import { cookies } from "next/headers";

import { MERCHANT_TOKEN_COOKIE } from "./constants";
import { verifyMerchantToken } from "./verify-token";

/** Server Action: 폼 hidden `token`(구버전) 또는 httpOnly 쿠키. */
export async function getMerchantTokenForAction(formData: FormData): Promise<string | null> {
  const fromForm = String(formData.get("token") ?? "").trim();
  if (verifyMerchantToken(fromForm)) return fromForm;

  const jar = await cookies();
  const fromCookie = jar.get(MERCHANT_TOKEN_COOKIE)?.value;
  if (verifyMerchantToken(fromCookie)) {
    return String(fromCookie).trim();
  }
  return null;
}
