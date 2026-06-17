# 점주 계정 · 비밀번호 (P0)

**우선순위:** `docs/CHAYA_PRODUCT_PRIORITY_PILOT.md` P0

## 기능

| 기능 | 경로 | 비고 |
|------|------|------|
| 비밀번호 찾기 | `/m/forgot-password` | 이메일 모드만 (`NEXT_PUBLIC_MERCHANT_LOGIN_SMS` 미설정) |
| 재설정 (메일 링크) | `/m/auth/confirm` → `/m/reset-password` | Supabase Redirect URLs 필수 |
| 비밀번호 변경 (로그인 후) | `/m/{tenant}/more/account` | 현재 비밀번호 확인 후 변경 |
| 로그아웃 안내 | `/m/login?ok=logged_out` | POST `/m/logout` 후 |

## Supabase 설정 (필수)

**Authentication → URL configuration → Redirect URLs** 에 프로덕션·프리뷰 호스트 기준으로 추가:

- `https://{호스트}/m/auth/confirm`
- (권장) `https://{호스트}/m/reset-password`

**Site URL** 은 배포 도메인과 맞출 것 (`NEXT_PUBLIC_SITE_URL` 권장).

비밀번호 재설정 메일의 `redirectTo` 는 앱이 `{origin}/m/auth/confirm?next=/m/reset-password` 로 보냅니다.

## 점주 안내 (현장)

1. `/m/login` → **비밀번호를 잊었습니다**
2. 초대 이메일 입력 → 메일 링크 → 새 비밀번호 (8자 이상)
3. 이미 로그인 중이면 **더보기 → 비밀번호 · 계정**

SMS 로그인 모드에서는 비밀번호 기능을 쓰지 않습니다.

## 구현 파일

- `lib/merchant/merchant-password-auth.ts`
- `app/m/forgot-password/*`, `app/m/reset-password/*`, `app/m/auth/confirm/route.ts`
- `app/m/[tenant]/more/account/*`
