import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { sanitizeMerchantNextPath } from "@/lib/merchant/merchant-access";
import { getSupabaseServiceUrl } from "@/lib/supabase/resolve-service-config";

/** 이메일·비밀번호 로그인(기본). SMS 모드에서는 `/m/login` 이 이 경로를 쓰지 않습니다. */

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
