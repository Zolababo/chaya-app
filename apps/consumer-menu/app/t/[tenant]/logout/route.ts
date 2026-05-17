import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeConsumerNextPath } from "@/lib/consumer/consumer-path";
import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/security/simple-rate-limit";
import { denyIfUntrustedFormPost } from "@/lib/security/trusted-browser-post";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

type RouteContext = { params: Promise<{ tenant: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const untrusted = denyIfUntrustedFormPost(request);
  if (untrusted) return untrusted;

  const { tenant: tenantRaw } = await context.params;
  const tenant = normalizeTenantSlug(tenantRaw) ?? tenantRaw.trim();

  const rlKey = rateLimitKeyFromRequest(request, "t-logout");
  if (isRateLimited(rlKey, 40, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  let nextPath = `/t/${tenant}`;
  try {
    const formData = await request.formData();
    const nextRaw = String(formData.get("next") ?? "").trim();
    nextPath = sanitizeConsumerNextPath(nextRaw, tenant) ?? nextPath;
  } catch {
    /* ignore */
  }

  const response = NextResponse.redirect(new URL(nextPath, request.nextUrl.origin), {
    status: 303,
  });

  const url = getSupabaseServiceUrl();
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anon) return response;

  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as CookieOptions | undefined),
        );
      },
    },
  });

  await supabase.auth.signOut();
  return response;
}

export async function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
