import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSupabaseAuthSession } from "@/lib/supabase/supabase-middleware";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/m") || pathname.startsWith("/ops")) {
    return updateSupabaseAuthSession(request);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/m/:path*", "/ops/:path*"],
};
