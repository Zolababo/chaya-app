import type { NextRequest } from "next/server";

import { sanitizeMerchantNextPath } from "@/lib/merchant/merchant-access";

/** 점주 비밀번호 최소 길이 (재설정·변경 공통). */
export const MERCHANT_PASSWORD_MIN_LENGTH = 8;

export function isMerchantPasswordStrongEnough(password: string): boolean {
  return password.length >= MERCHANT_PASSWORD_MIN_LENGTH;
}

/** Supabase Auth 이메일 링크가 돌아올 확인 URL (Redirect URLs에 등록 필요). */
export function merchantAuthConfirmUrl(origin: string, nextPath: string): string {
  const base = origin.replace(/\/+$/, "");
  const next = sanitizeMerchantNextPath(nextPath) ?? "/m/reset-password";
  const u = new URL("/m/auth/confirm", base);
  u.searchParams.set("next", next);
  return u.toString();
}

export function redirectForgotPassword(request: NextRequest, code: string): URL {
  const u = new URL("/m/forgot-password", request.nextUrl.origin);
  if (code) u.searchParams.set("e", code);
  return u;
}

export function redirectResetPassword(request: NextRequest, code: string): URL {
  const u = new URL("/m/reset-password", request.nextUrl.origin);
  if (code) u.searchParams.set("e", code);
  return u;
}

export function redirectAccountSettings(
  request: NextRequest,
  tenant: string,
  code: string,
  kind: "e" | "ok" = "e",
): URL {
  const u = new URL(`/m/${encodeURIComponent(tenant)}/more/account`, request.nextUrl.origin);
  u.searchParams.set(kind, code);
  return u;
}

export function forgotPasswordErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "missing":
      return "이메일을 입력해 주세요.";
    case "bad_email":
      return "이메일 형식을 확인해 주세요.";
    case "no_anon":
      return "NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인해 주세요.";
    case "rate_limit":
      return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
    case "send_failed":
      return "메일 발송에 실패했습니다. Supabase 이메일 설정·Redirect URL을 확인해 주세요.";
    default:
      return null;
  }
}

export function resetPasswordErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "missing":
      return "새 비밀번호를 입력해 주세요.";
    case "weak_password":
      return `비밀번호는 ${MERCHANT_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
    case "mismatch":
      return "새 비밀번호 확인이 일치하지 않습니다.";
    case "no_session":
      return "링크가 만료되었거나 로그인이 없습니다. 비밀번호 찾기를 다시 요청해 주세요.";
    case "update_failed":
      return "비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.";
    case "invalid_link":
      return "인증 링크가 올바르지 않습니다. 메일의 링크를 다시 누르거나 비밀번호 찾기를 다시 요청해 주세요.";
    case "no_anon":
      return "NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인해 주세요.";
    case "rate_limit":
      return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return null;
  }
}

export function accountPasswordErrorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "missing":
      return "현재 비밀번호와 새 비밀번호를 모두 입력해 주세요.";
    case "weak_password":
      return `새 비밀번호는 ${MERCHANT_PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`;
    case "mismatch":
      return "새 비밀번호 확인이 일치하지 않습니다.";
    case "auth":
      return "현재 비밀번호가 올바르지 않습니다.";
    case "no_session":
      return "로그인이 필요합니다. 다시 로그인해 주세요.";
    case "update_failed":
      return "비밀번호를 바꾸지 못했습니다. 잠시 후 다시 시도해 주세요.";
    case "no_anon":
      return "NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인해 주세요.";
    case "rate_limit":
      return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
    case "sms_mode":
      return "문자(SMS) 로그인 계정은 비밀번호 변경을 사용하지 않습니다.";
    default:
      return null;
  }
}
