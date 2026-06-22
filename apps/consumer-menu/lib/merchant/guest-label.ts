/** 점주 UI용 익명 손님 가명 — raw guest_session_id 는 노출하지 않음. */
export function formatGuestLabel(guestSessionId: string): string {
  const s = guestSessionId.trim();
  if (!s) return "#???";
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const code = (h >>> 0).toString(16).toUpperCase().slice(-3).padStart(3, "0");
  return `#${code}`;
}
