/**
 * 점주(`/m/login`) 로그인·`/ops` 초대 방식.
 * 기본값: 이메일·비밀번호(테스트, SMS 불필요).
 * `"true"` 시: 문자 OTP 로그인 + 휴대폰 초대 → Supabase Phone·Twilio 필수.
 */
export function merchantLoginUsesSms(): boolean {
  return process.env.NEXT_PUBLIC_MERCHANT_LOGIN_SMS === "true";
}
