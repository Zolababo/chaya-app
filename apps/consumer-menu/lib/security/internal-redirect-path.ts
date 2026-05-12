/**
 * 로그인 후 `next` 등에 쓰는 **같은 오리진** 상대 경로만 허용합니다.
 * `/m/../ops` 처럼 정규화되면 접두사 밖으로 나가는 경로는 거부해 오픈 리다이렉트를 막습니다.
 */
const DUMMY_ORIGIN = "https://redirect-check.invalid";

export type InternalRedirectKind = "merchant" | "ops";

function resolvedPathUnderPrefix(pathname: string, prefix: "/m" | "/ops"): boolean {
  if (prefix === "/m") {
    return pathname === "/m" || pathname.startsWith("/m/");
  }
  return pathname === "/ops" || pathname.startsWith("/ops/");
}

function isLoginPath(pathname: string, prefix: "/m" | "/ops"): boolean {
  if (prefix === "/m") {
    return pathname === "/m/login" || pathname.startsWith("/m/login/");
  }
  return pathname === "/ops/login" || pathname.startsWith("/ops/login/");
}

/**
 * @returns 검증된 **path + query** (hash 제외). 실패 시 `null`.
 */
export function sanitizeInternalRedirectPath(
  raw: string | undefined | null,
  kind: InternalRedirectKind,
): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s.startsWith("/")) return null;
  if (s.startsWith("//") || s.includes("://") || s.includes("\\")) return null;
  if (/\0/.test(s)) return null;

  const prefix: "/m" | "/ops" = kind === "merchant" ? "/m" : "/ops";
  const defaultPath = kind === "merchant" ? "/m" : "/ops";

  let pathname: string;
  let search: string;
  try {
    const u = new URL(s, DUMMY_ORIGIN);
    pathname = u.pathname;
    search = u.search;
  } catch {
    return null;
  }

  if (!resolvedPathUnderPrefix(pathname, prefix)) {
    return null;
  }

  if (isLoginPath(pathname, prefix)) {
    return defaultPath;
  }

  const out = `${pathname}${search}`;
  return out.length > 0 ? out : defaultPath;
}
