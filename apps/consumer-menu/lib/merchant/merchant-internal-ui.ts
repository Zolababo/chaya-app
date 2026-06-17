/** `true` 일 때만 점주 화면에 내부·개발자 안내(ARCHITECTURE, env 이름 등)를 노출합니다. */
export function isMerchantInternalUiVisible(): boolean {
  return process.env.NEXT_PUBLIC_MERCHANT_INTERNAL_UI === "true";
}
