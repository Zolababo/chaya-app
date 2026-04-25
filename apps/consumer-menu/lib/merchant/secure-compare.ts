/** Edge·Node 공통 UTF-8 바이트 단위 상수 시간 비교. */
export function timingSafeEqualUtf8(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  if (ab.length !== bb.length) return false;
  let r = 0;
  for (let i = 0; i < ab.length; i++) r |= ab[i]! ^ bb[i]!;
  return r === 0;
}
