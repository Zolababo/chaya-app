/** URL 세그먼트 `/t/{slug}`, `/m/{slug}` 에 쓰는 테넌트 슬러그. ASCII 소문자·숫자·하이픈만 허용. */
const MAX_LEN = 120;
const MIN_LEN = 2;

/**
 * 운영자 입력을 슬러그로 정규화합니다. 공백은 하이픈으로 바꾸고, 허용되지 않는 문자는 제거합니다.
 * 결과가 비어 있거나 길이 제한을 벗어나면 `null`.
 */
export function normalizeTenantSlug(raw: string): string | null {
  const s0 = raw.trim().toLowerCase().replace(/\s+/g, "-");
  const s1 = s0.replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-");
  const s = s1.replace(/^-+/, "").replace(/-+$/, "");
  if (s.length < MIN_LEN || s.length > MAX_LEN) return null;
  return s;
}
