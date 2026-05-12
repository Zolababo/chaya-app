import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeMerchantNextPath } from "@/lib/merchant/merchant-access";
import {
  clearMerchantOtpPhoneCookieOptions,
  MERCHANT_OTP_PHONE_COOKIE,
  merchantOtpPhoneCookieOptions,
} from "@/lib/merchant/merchant-otp-cookie";
import { normalizeKrPhoneToE164 } from "@/lib/merchant/phone-e164-kr";
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/security/simple-rate-limit";
import { denyIfUntrustedFormPost } from "@/lib/security/trusted-browser-post";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

function redirectLogin(request: NextRequest, e: string, safeNext: string) {
  const u = new URL("/m/login", request.nextUrl.origin);
  u.searchParams.set("e", e);
  u.searchParams.set("next", safeNext);
  return NextResponse.redirect(u, { status: 303 });
}

export async function POST(request: NextRequest) {
  const untrusted = denyIfUntrustedFormPost(request);
  if (untrusted) return untrusted;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return redirectLogin(request, "missing", "/m");
  }

  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const nextRaw = String(formData.get("next") ?? "").trim();
  const safeNext = sanitizeMerchantNextPath(nextRaw) ?? "/m";

  const rlKey = rateLimitKeyFromRequest(request, "m-login-send-otp");
  if (isRateLimited(rlKey, 8, 15 * 60 * 1000)) {
    return redirectLogin(request, "rate_limit", safeNext);
  }

  const phone = normalizeKrPhoneToE164(phoneRaw);
  if (!phone) {
    return redirectLogin(request, "bad_phone", safeNext);
  }

  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return redirectLogin(request, "no_anon", safeNext);
  }

  const confirmUrl = new URL("/m/login", request.nextUrl.origin);
  confirmUrl.searchParams.set("phase", "confirm");
  confirmUrl.searchParams.set("next", safeNext);

  const redirectResp = NextResponse.redirect(confirmUrl, { status: 303 });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          redirectResp.cookies.set(name, value, options as CookieOptions | undefined),
        );
      },
    },
  });

  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) {
    const fail = redirectLogin(request, "send_failed", safeNext);
    fail.cookies.set(MERCHANT_OTP_PHONE_COOKIE, "", clearMerchantOtpPhoneCookieOptions());
    return fail;
  }

  redirectResp.cookies.set(MERCHANT_OTP_PHONE_COOKIE, phone, merchantOtpPhoneCookieOptions());
  return redirectResp;
}
