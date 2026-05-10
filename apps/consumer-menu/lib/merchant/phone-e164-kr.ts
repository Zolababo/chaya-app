/**
 * 한국 휴대폰 입력을 Supabase Phone Auth(E.164) 형식(+8210…)으로 바꿉니다.
 */

function toPlus82FromLocal(local: string): string | null {
  if (/^010\d{8}$/.test(local)) return `+82${local.slice(1)}`;
  if (/^011\d{7,8}$/.test(local)) return `+82${local.slice(1)}`;
  if (/^01[6789]\d{7,8}$/.test(local)) return `+82${local.slice(1)}`;
  return null;
}

export function normalizeKrPhoneToE164(raw: string): string | null {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return null;

  const digits = trimmed.replace(/\D/g, "");

  if (/^010\d{8}$/.test(digits) || /^011\d{7,8}$/.test(digits) || /^01[6789]\d{7,8}$/.test(digits)) {
    return toPlus82FromLocal(digits);
  }

  const intlDigits = trimmed.startsWith("+") ? trimmed.slice(1).replace(/\D/g, "") : "";

  let subNational: string | null = null;
  if (intlDigits.startsWith("82")) {
    subNational = intlDigits.slice(2);
  } else if (digits.startsWith("82")) {
    subNational = digits.slice(2);
  }

  if (subNational && !subNational.startsWith("0")) {
    let localCandidate = "";
    if (/^10\d{8}$/.test(subNational)) localCandidate = `0${subNational}`;
    else if (/^11\d{7,8}$/.test(subNational)) localCandidate = `0${subNational}`;
    else if (/^1[6789]\d{7,8}$/.test(subNational)) localCandidate = `0${subNational}`;
    if (localCandidate) return toPlus82FromLocal(localCandidate);
    return null;
  }

  if (subNational?.startsWith("0")) {
    return toPlus82FromLocal(subNational);
  }

  return null;
}
