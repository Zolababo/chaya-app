export const MERCHANT_OTP_PHONE_COOKIE = "chaya_merchant_otp_phone";

export function merchantOtpPhoneCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/m",
    maxAge: 600,
  };
}

export function clearMerchantOtpPhoneCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/m",
    maxAge: 0,
  };
}
