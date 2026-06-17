import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  merchantAuthConfirmUrl,
  redirectForgotPassword,
} from "@/lib/merchant/merchant-password-auth";
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/security/simple-rate-limit";
import { denyIfUntrustedFormPost } from "@/lib/security/trusted-browser-post";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const untrusted = denyIfUntrustedFormPost(request);
  if (untrusted) return untrusted;

  const rlKey = rateLimitKeyFromRequest(request, "m-forgot-password");
  if (isRateLimited(rlKey, 8, 15 * 60 * 1000)) {
    return NextResponse.redirect(redirectForgotPassword(request, "rate_limit"), { status: 303 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(redirectForgotPassword(request, "missing"), { status: 303 });
  }

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email) {
    return NextResponse.redirect(redirectForgotPassword(request, "missing"), { status: 303 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.redirect(redirectForgotPassword(request, "bad_email"), { status: 303 });
  }

  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.redirect(redirectForgotPassword(request, "no_anon"), { status: 303 });
  }

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        /* forgot flow does not need session cookies on this response */
      },
    },
  });

  const redirectTo = merchantAuthConfirmUrl(request.nextUrl.origin, "/m/reset-password");
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });

  if (error) {
    return NextResponse.redirect(redirectForgotPassword(request, "send_failed"), { status: 303 });
  }

  const okUrl = redirectForgotPassword(request, "");
  okUrl.searchParams.set("ok", "sent");
  return NextResponse.redirect(okUrl, { status: 303 });
}
