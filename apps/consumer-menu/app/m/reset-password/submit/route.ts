import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import {
  isMerchantPasswordStrongEnough,
  redirectResetPassword,
} from "@/lib/merchant/merchant-password-auth";
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/security/simple-rate-limit";
import { denyIfUntrustedFormPost } from "@/lib/security/trusted-browser-post";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

export async function POST(request: NextRequest) {
  const untrusted = denyIfUntrustedFormPost(request);
  if (untrusted) return untrusted;

  const rlKey = rateLimitKeyFromRequest(request, "m-reset-password");
  if (isRateLimited(rlKey, 15, 15 * 60 * 1000)) {
    return NextResponse.redirect(redirectResetPassword(request, "rate_limit"), { status: 303 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(redirectResetPassword(request, "missing"), { status: 303 });
  }

  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");

  if (!password || !confirm) {
    return NextResponse.redirect(redirectResetPassword(request, "missing"), { status: 303 });
  }
  if (!isMerchantPasswordStrongEnough(password)) {
    return NextResponse.redirect(redirectResetPassword(request, "weak_password"), { status: 303 });
  }
  if (password !== confirm) {
    return NextResponse.redirect(redirectResetPassword(request, "mismatch"), { status: 303 });
  }

  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.redirect(redirectResetPassword(request, "no_anon"), { status: 303 });
  }

  const doneUrl = new URL("/m/reset-password", request.nextUrl.origin);
  doneUrl.searchParams.set("ok", "1");
  const redirectDone = NextResponse.redirect(doneUrl, { status: 303 });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          redirectDone.cookies.set(name, value, options as CookieOptions | undefined),
        );
      },
    },
  });

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.redirect(redirectResetPassword(request, "no_session"), { status: 303 });
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return NextResponse.redirect(redirectResetPassword(request, "update_failed"), { status: 303 });
  }

  await supabase.auth.signOut();
  return redirectDone;
}
