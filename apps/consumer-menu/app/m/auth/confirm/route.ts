import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeMerchantNextPath } from "@/lib/merchant/merchant-access";
import { redirectResetPassword } from "@/lib/merchant/merchant-password-auth";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

const OTP_TYPES = new Set<string>(["recovery", "signup", "invite", "magiclink", "email_change", "email"]);

/**
 * Supabase 이메일 링크(비밀번호 재설정 등) → 세션 쿠키 설정 후 `next` 로 이동.
 * Supabase Dashboard → Authentication → URL configuration 에
 * `https://{host}/m/auth/confirm` 를 Redirect URLs에 추가해야 합니다.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const typeRaw = searchParams.get("type");
  const nextRaw = searchParams.get("next");
  const safeNext = sanitizeMerchantNextPath(nextRaw) ?? "/m/reset-password";

  if (!token_hash || !typeRaw || !OTP_TYPES.has(typeRaw)) {
    return NextResponse.redirect(redirectResetPassword(request, "invalid_link"), { status: 303 });
  }

  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.redirect(redirectResetPassword(request, "no_anon"), { status: 303 });
  }

  const redirectSuccess = NextResponse.redirect(new URL(safeNext, request.url), { status: 303 });

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
    token_hash,
    type: typeRaw as EmailOtpType,
  });

  if (error) {
    return NextResponse.redirect(redirectResetPassword(request, "invalid_link"), { status: 303 });
  }

  return redirectSuccess;
}
