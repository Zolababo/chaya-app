import { NextResponse, type NextRequest } from "next/server";

/**
 * 브라우저가 다른 사이트에서 보낸 폼 POST(크로스 사이트)를 거부합니다.
 * `Sec-Fetch-Site: cross-site` + Origin/Referer 검증으로 CSRF 난이도를 올립니다.
 * (비브라우저 클라이언트는 헤더가 없을 수 있어, 프로덕션에서만 Origin/Referer를 엄격히 요구합니다.)
 */
function sameOriginFromHeaders(request: NextRequest): boolean {
  const expected = request.nextUrl.origin;
  const origin = request.headers.get("origin");
  if (origin) {
    return origin === expected;
  }
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === expected;
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * @returns `null` 이면 통과, 아니면 그대로 응답 반환(403 등).
 */
export function denyIfUntrustedFormPost(request: NextRequest): NextResponse | null {
  const site = request.headers.get("sec-fetch-site");
  if (site === "cross-site") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (process.env.NODE_ENV === "production") {
    if (!sameOriginFromHeaders(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return null;
}
