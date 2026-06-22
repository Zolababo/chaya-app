import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { isConsumerMenuHomePath, CONSUMER_ROUTE_HEADER } from "@/lib/consumer/consumer-route";
import { getLocaleCookieName } from "@/lib/i18n/consumer-locale-cookie";
import { isAppLocale } from "@/lib/i18n/locales";
import { updateSupabaseAuthSession } from "@/lib/supabase/supabase-middleware";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

function applyLocaleCookie(request: NextRequest, response: NextResponse): NextResponse {
  const lang = request.nextUrl.searchParams.get("lang")?.trim();
  if (lang && isAppLocale(lang)) {
    response.cookies.set(getLocaleCookieName(), lang, {
      path: "/",
      maxAge: LOCALE_COOKIE_MAX_AGE,
      sameSite: "lax",
    });
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/m") || pathname.startsWith("/ops")) {
    return updateSupabaseAuthSession(request);
  }

  if (pathname.startsWith("/t/")) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-chaya-consumer", "1");
    if (isConsumerMenuHomePath(pathname)) {
      requestHeaders.set(CONSUMER_ROUTE_HEADER, "home");
    }
    return applyLocaleCookie(
      request,
      NextResponse.next({ request: { headers: requestHeaders } }),
    );
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/m/:path*", "/ops/:path*", "/t/:path*"],
};
