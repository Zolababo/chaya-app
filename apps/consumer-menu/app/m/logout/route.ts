import { NextResponse } from "next/server";

import { MERCHANT_TOKEN_COOKIE } from "@/lib/merchant/constants";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const res = NextResponse.redirect(new URL("/", url.origin), 303);
  res.cookies.set(MERCHANT_TOKEN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
