import { getLocaleCookieName } from "./consumer-locale-cookie";
import { parseAppLocale, type AppLocale } from "./locales";

export function readConsumerLocaleCookieClient(): AppLocale | null {
  if (typeof document === "undefined") return null;
  const name = getLocaleCookieName();
  const parts = document.cookie.split(";").map((p) => p.trim());
  const hit = parts.find((p) => p.startsWith(`${name}=`));
  if (!hit) return null;
  const raw = hit.slice(name.length + 1);
  try {
    return parseAppLocale(decodeURIComponent(raw));
  } catch {
    return parseAppLocale(raw);
  }
}
