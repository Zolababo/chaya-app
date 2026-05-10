import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeMerchantNextPath } from "@/lib/merchant/merchant-access";
import {
  clearMerchantOtpPhoneCookieOptions,
  MERCHANT_OTP_PHONE_COOKIE,
  merchantOtpPhoneCookieOptions,
} from "@/lib/merchant/merchant-otp-cookie";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

function redirectLogin(request: NextRequest, e: string, safeNext: string) {
  const u = new URL("/m/login", request.nextUrl.origin);
  u.searchParams.set("e", e);
  u.searchParams.set("next", safeNext);
  const res = NextResponse.redirect(u, { status: 303 });
  res.cookies.set(MERCHANT_OTP_PHONE_COOKIE, "", clearMerchantOtpPhoneCookieOptions());
  return res;
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return redirectLogin(request, "missing", "/m");
  }

  const token = String(formData.get("token") ?? "").trim().replace(/\s/g, "");
  const nextRaw = String(formData.get("next") ?? "").trim();
  const safeNext = sanitizeMerchantNextPath(nextRaw) ?? "/m";

  if (!token || token.length < 4) {
    return redirectLogin(request, "missing", safeNext);
  }

  const phone = request.cookies.get(MERCHANT_OTP_PHONE_COOKIE)?.value?.trim();
  if (!phone) {
    return redirectLogin(request, "otp_session", safeNext);
  }

  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return redirectLogin(request, "no_anon", safeNext);
  }

  const redirectSuccess = NextResponse.redirect(new URL(safeNext, request.nextUrl.origin), {
    status: 303,
  });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          redirectSuccess.cookies.set(name, value, options as CookieOptions | undefined),
        );
      },
    },
  });

  const { error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: "sms",
  });

  if (error) {
    const u = new URL("/m/login", request.nextUrl.origin);
    u.searchParams.set("phase", "confirm");
    u.searchParams.set("next", safeNext);
    u.searchParams.set("e", "verify_failed");
    const res = NextResponse.redirect(u, { status: 303 });
    res.cookies.set(MERCHANT_OTP_PHONE_COOKIE, phone, merchantOtpPhoneCookieOptions());
    return res;
  }

  redirectSuccess.cookies.set(MERCHANT_OTP_PHONE_COOKIE, "", clearMerchantOtpPhoneCookieOptions());
  return redirectSuccess;
}
