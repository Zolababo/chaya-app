import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isMerchantPasswordStrongEnough, redirectAccountSettings } from "@/lib/merchant/merchant-password-auth";
import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/security/simple-rate-limit";
import { denyIfUntrustedFormPost } from "@/lib/security/trusted-browser-post";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

type RouteContext = { params: Promise<{ tenant: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const untrusted = denyIfUntrustedFormPost(request);
  if (untrusted) return untrusted;

  const { tenant: tenantRaw } = await context.params;
  const tenant = normalizeTenantSlug(tenantRaw);
  if (!tenant) {
    return NextResponse.redirect(new URL("/m/login", request.nextUrl.origin), { status: 303 });
  }

  if (merchantLoginUsesSms()) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "sms_mode"), { status: 303 });
  }

  const rlKey = rateLimitKeyFromRequest(request, "m-change-password");
  if (isRateLimited(rlKey, 15, 15 * 60 * 1000)) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "rate_limit"), { status: 303 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "missing"), { status: 303 });
  }

  const current = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");

  if (!current || !password || !confirm) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "missing"), { status: 303 });
  }
  if (!isMerchantPasswordStrongEnough(password)) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "weak_password"), { status: 303 });
  }
  if (password !== confirm) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "mismatch"), { status: 303 });
  }

  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "no_anon"), { status: 303 });
  }

  const redirectOk = NextResponse.redirect(redirectAccountSettings(request, tenant, "password_changed", "ok"), {
    status: 303,
  });

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          redirectOk.cookies.set(name, value, options as CookieOptions | undefined),
        );
      },
    },
  });

  const { data: userData } = await supabase.auth.getUser();
  const email = userData.user?.email?.trim();
  if (!email) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "no_session"), { status: 303 });
  }

  const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current });
  if (signInErr) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "auth"), { status: 303 });
  }

  const { error: updateErr } = await supabase.auth.updateUser({ password });
  if (updateErr) {
    return NextResponse.redirect(redirectAccountSettings(request, tenant, "update_failed"), { status: 303 });
  }

  return redirectOk;
}
