import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeMerchantNextPath } from "@/lib/merchant/merchant-access";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

/** `/m/login` 페이지와 분리(`/m/login/submit`): 세션 쿠키를 리다이렉트 응답에 붙여 프로덕션에서 안정적으로 동작시킵니다. */

function redirectLogin(request: NextRequest, e: string, safeNext: string) {
  const u = new URL("/m/login", request.nextUrl.origin);
  u.searchParams.set("e", e);
  u.searchParams.set("next", safeNext);
  return NextResponse.redirect(u, { status: 303 });
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return redirectLogin(request, "missing", "/m");
  }

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const nextRaw = String(formData.get("next") ?? "").trim();
  const safeNext = sanitizeMerchantNextPath(nextRaw) ?? "/m";

  if (!email || !password) {
    return redirectLogin(request, "missing", safeNext);
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

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const errCode = error.code === "email_not_confirmed" ? "unconfirmed" : "auth";
    return redirectLogin(request, errCode, safeNext);
  }

  return redirectSuccess;
}
