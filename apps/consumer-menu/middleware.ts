import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { MERCHANT_TOKEN_COOKIE } from "@/lib/merchant/constants";
import { timingSafeEqualUtf8 } from "@/lib/merchant/secure-compare";

function noindex(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (!pathname.startsWith("/m")) {
    return NextResponse.next();
  }

  if (pathname === "/m/logout") {
    return noindex(NextResponse.next());
  }

  const urlToken = searchParams.get("token");
  const expected = process.env.MERCHANT_ORDERS_TOKEN?.trim();

  if (urlToken && expected && timingSafeEqualUtf8(urlToken.trim(), expected)) {
    const dest = request.nextUrl.clone();
    dest.searchParams.delete("token");
    const res = NextResponse.redirect(dest, 303);
    res.cookies.set(MERCHANT_TOKEN_COOKIE, urlToken.trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return noindex(res);
  }

  return noindex(NextResponse.next());
}

export const config = {
  matcher: ["/m/:path*"],
};
