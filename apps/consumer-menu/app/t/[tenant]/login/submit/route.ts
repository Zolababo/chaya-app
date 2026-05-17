import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeConsumerNextPath } from "@/lib/consumer/consumer-path";
import { sanitizeGuestSessionId, sanitizeTenantSlug } from "@/lib/orders/guest-order-validation";
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/security/simple-rate-limit";
import { denyIfUntrustedFormPost } from "@/lib/security/trusted-browser-post";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

type RouteContext = { params: Promise<{ tenant: string }> };

function redirectLogin(request: NextRequest, tenant: string, e: string, safeNext: string) {
  const u = new URL(`/t/${encodeURIComponent(tenant)}/login`, request.nextUrl.origin);
  u.searchParams.set("e", e);
  u.searchParams.set("next", safeNext);
  return NextResponse.redirect(u, { status: 303 });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const untrusted = denyIfUntrustedFormPost(request);
  if (untrusted) return untrusted;

  const { tenant: tenantRaw } = await context.params;
  const tenantNorm = normalizeTenantSlug(tenantRaw);
  if (!tenantNorm) {
    return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return redirectLogin(request, tenantNorm, "missing", `/t/${tenantNorm}/orders`);
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim();
  const safeNext =
    sanitizeConsumerNextPath(nextRaw, tenantNorm) ?? `/t/${tenantNorm}/orders`;
  const guestSessionRaw = String(formData.get("guest_session_id") ?? "").trim();

  const rlKey = rateLimitKeyFromRequest(request, "t-login-submit");
  if (isRateLimited(rlKey, 25, 15 * 60 * 1000)) {
    return redirectLogin(request, tenantNorm, "rate_limit", safeNext);
  }

  if (!email || !password) {
    return redirectLogin(request, tenantNorm, "missing", safeNext);
  }

  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) {
    return redirectLogin(request, tenantNorm, "no_anon", safeNext);
  }

  const tenantCheck = sanitizeTenantSlug(tenantNorm);
  const sid = sanitizeGuestSessionId(guestSessionRaw || null);

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const errCode = error.code === "email_not_confirmed" ? "unconfirmed" : "auth";
    return redirectLogin(request, tenantNorm, errCode, safeNext);
  }

  if (tenantCheck.ok && sid) {
    const { data: claimed, error: claimErr } = await supabase.rpc("claim_guest_orders_for_user", {
      p_tenant_slug: tenantCheck.slug,
      p_guest_session_id: sid,
    });
    if (!claimErr && claimed != null) {
      const n = typeof claimed === "number" ? claimed : Number(claimed);
      if (Number.isFinite(n) && n > 0) {
        const withClaim = new URL(safeNext, request.nextUrl.origin);
        withClaim.searchParams.set("claimed", String(Math.trunc(n)));
        redirectSuccess.headers.set("Location", withClaim.toString());
      }
    }
  }

  return redirectSuccess;
}
