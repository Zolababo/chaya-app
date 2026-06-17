import "server-only";

import { cookies } from "next/headers";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { sanitizeGuestSessionId } from "@/lib/orders/guest-order-validation";

/** SSR·Server Action — `GuestSessionCookieSync` 가 맞춘 `Path=/` 쿠키 */
export async function readGuestSessionIdFromCookies(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(GUEST_SESSION_STORAGE_KEY)?.value;
  if (!raw) return null;
  try {
    return sanitizeGuestSessionId(decodeURIComponent(raw).trim());
  } catch {
    return sanitizeGuestSessionId(raw.trim());
  }
}
