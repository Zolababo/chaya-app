import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeMerchantNextPath } from "@/lib/merchant/merchant-access";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

export async function POST(request: NextRequest) {
  let nextPath: string | null = null;
  try {
    const formData = await request.formData();
    const nextRaw = String(formData.get("next") ?? "").trim();
    nextPath = sanitizeMerchantNextPath(nextRaw);
  } catch {
    nextPath = null;
  }

  const loginUrl = new URL("/m/login", request.nextUrl.origin);
  if (nextPath) {
    loginUrl.searchParams.set("next", nextPath);
  }

  const response = NextResponse.redirect(loginUrl, { status: 303 });

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
