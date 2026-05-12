import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isRateLimited, rateLimitKeyFromRequest } from "@/lib/security/simple-rate-limit";
import { denyIfUntrustedFormPost } from "@/lib/security/trusted-browser-post";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

export async function POST(request: NextRequest) {
  const untrusted = denyIfUntrustedFormPost(request);
  if (untrusted) return untrusted;

  const rlKey = rateLimitKeyFromRequest(request, "ops-logout");
  if (isRateLimited(rlKey, 40, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
  }

  const dest = new URL("/ops/login", request.nextUrl.origin).toString();
  const response = NextResponse.redirect(dest, { status: 303 });

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
