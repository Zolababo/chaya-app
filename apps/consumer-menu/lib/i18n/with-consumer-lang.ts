import type { AppLocale } from "./locales";

/** 내부 링크에 `lang`(·`table`) 쿼리를 붙여 서버·헤더·장바구니가 같은 컨텍스트를 씁니다. */
export function withConsumerLang(
  path: string,
  locale: AppLocale,
  table?: string | null,
): string {
  const sep = path.includes("?") ? "&" : "?";
  let q = `lang=${encodeURIComponent(locale)}`;
  const t = table?.trim();
  if (t) q += `&table=${encodeURIComponent(t)}`;
  return `${path}${sep}${q}`;
}
