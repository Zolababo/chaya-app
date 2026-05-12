# Merchant Migration Runbook (Demo -> `/m/*`)

Vercel·Supabase·모바일까지 한 번에 점검하려면 **`docs/RUNTIME_GO_LIVE_CHECKLIST.md`** 를 함께 보세요.

기존 점주 데모(`chaya-menu-test`)가 실제 주문 운영과 연결되어 있다면, 즉시 전면 전환보다 병행 운영이 안전합니다.

## 1) 결론 먼저

- 지금은 **마이그레이션 "필수"가 아니라 전환 절차 "필수"** 입니다.
- 이유: 현재 통합 앱(`chaya-app`의 `/m/[tenant]/*`)은 기존 `orders`, `ChayaMenus`를 그대로 읽고 쓰므로
  DB 스키마를 새로 갈아엎는 migration보다 **운영 동선 전환** 리스크가 큽니다.
- 따라서 권장 전략은 **Blue/Green 병행**:
  - Blue: 기존 데모 점주앱
  - Green: 통합 앱 점주 경로(`/m/[tenant]/orders`, `/m/[tenant]/menus`)

## 2) 왜 아까 Stitch 양식이 안 보였는가

- Stitch UI 반영은 통합 앱(`/m/*`)에 적용되었습니다.
- 기존 데모 URL(`chaya-menu-test`)은 별도 배포물이므로 동일 변경이 자동 반영되지 않습니다.
- 즉, "없어진 것"이 아니라 **확인한 앱이 달랐던 상태**입니다.

## 3) 병행 운영 체크리스트 (최소 3~7일)

1. 같은 tenant로 두 앱에서 아래를 각각 실행:
   - 신규 주문 인입 확인
   - 주문 상태 변경(accepted/preparing/ready/completed)
   - 메뉴 추가/수정/삭제
2. 소비자 앱에서 생성한 주문이 두 점주앱 모두에 동일히 보이는지 확인.
3. 운영 시간대(피크 포함)에서 지연/누락 여부 기록.
4. 장애 대비 fallback 링크(기존 데모) 유지.
5. Go-live 전날, 매장 담당자에게 최종 점검 URL 1개로 고정 공지.

## 4) 전환(컷오버) 조건

아래 4개를 모두 만족하면 기존 데모 종료를 권장합니다.

- [ ] 최근 3일 연속으로 주문 누락/중복 없음
- [ ] 상태 변경 저장 실패율 0% 또는 원인 파악/복구 절차 확보
- [ ] 메뉴 CRUD 작업이 매장 운영자가 스스로 가능
- [ ] 점주 접속 안내 문서/연락 동선 정리 완료

## 5) 환경변수/접속 기준

- 점주앱 접근은 **Supabase Auth**(이메일·비밀번호)와 **`merchant_tenant_members`** 매핑 테이블(마이그레이션 `20260510183000_merchant_tenant_members.sql`)로 처리합니다.
- 로그인 URL: **`/m/login`** — 로그인 후 가게가 하나면 해당 `/m/{tenant}/orders`로, 여러 개면 `/m`에서 선택합니다.
- 점주 홈 화면 바로가기: Chrome(Android)에서 **`/m/login` 화면을 연 상태로** 「홈 화면에 추가」를 사용하세요.
  - 배포 확인: `/m/login/homescreen-manifest` JSON에 `"start_url":"/m/login"` 포함 여부 확인
  - 기존 아이콘이 손님 화면으로 열리면, 기존 아이콘 삭제 후 `/m/login`에서 재설치
- 계정 전환/강제 로그인: `?reauth=1` 쿼리로 자동 세션 이동을 건너뛰고 로그인 폼을 강제로 표시할 수 있습니다.
- 역할: `owner`(주문+메뉴), `staff`(주문만; 메뉴 관리·링크 숨김).
- Supabase **Authentication → Providers** 에서 Email 을 켜 두고, 점주용 사용자를 만든 뒤 SQL Editor에서 멤버를 묶습니다(예시):

```sql
insert into public.merchant_tenant_members (user_id, tenant_slug, role)
values ('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid, 'demo', 'owner');
```

(`user_id` 는 `auth.users` 의 해당 행 UUID.)

### `MERCHANT_ORDERS_TOKEN` 제거 후(아이디/비밀번호 운영) 바로 확인

- **Vercel Environment Variables**(Production·Preview 해당 환경)에 다음이 들어 있는지 확인:
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`(세션용)
  - `SUPABASE_SERVICE_ROLE_KEY`(또는 `SUPABASE_SECRET_KEY`) — 주문·메뉴 조회 서버 호출용
  - ~~`MERCHANT_ORDERS_TOKEN`~~ 삭제 상태 유지 (미사용)
- 변수 저장 후에는 **재배포**(또는 다음 배포)가 반영됩니다.
- **Supabase Dashboard → Authentication → URL configuration**: **Site URL** 을 배포 호스트와 맞춥니다 (예: `https://YOUR-APP.vercel.app`). PKCE·갱신 쿠키 동작 시 기준이 됩니다.
- 매장 접근이 안 되면: `merchant_tenant_members` 행 존재 여부, 사용자 이메일 **인증 완료** 여부(Auth에서 “Confirm email” 정책)를 확인합니다.
- 선택: `NEXT_PUBLIC_LEGACY_MERCHANT_URL`을 설정하면 `/m/*` 안내 배너에 기존 데모 링크를 노출해
  병행 운영 중 fallback 동선으로 사용할 수 있습니다.

## 5-b) 플랫폼 관리 화면 `/ops`(관리자)

- URL: **`/ops/login`** → 로그인 후 **`/ops`**, **`/ops/merchants`** 에서 점주 멤버십 관리.
- DB: 마이그레이션 `20260510210000_platform_operators.sql` 적용 필요.
- **첫 운영자 부트스트랩** (순서):
  1. Supabase **Authentication** 으로 본인(또는 운영 계정)을 이메일·비번으로 사용자 생성.
  2. SQL Editor:

```sql
insert into public.platform_operators (user_id)
values ('YOUR_AUTH_USER_UUID_HERE'::uuid);
```

  3. 배포 호스트에서 `/ops/login` 으로 로그인 → **점주 멤버십**에서 점주 등록·테넌트 연결(서버에 `SUPABASE_SERVICE_ROLE_KEY` 필요).  
     - **기본:** 이메일 + 임시 비밀번호 초대 → 점주는 `/m/login` 에서 **이메일·비밀번호** (`NEXT_PUBLIC_MERCHANT_LOGIN_SMS` 미설정 또는 `false`).  
     - **SMS 모드:** Vercel에 `NEXT_PUBLIC_MERCHANT_LOGIN_SMS=true` 이면 폼이 **휴대폰**만 되고, 점주는 `/m/login` 에서 OTP(**Phone**·Twilio 등 필수).

- 표시용 컬럼: `invite_email` → `20260511133000_merchant_tenant_invite_email.sql`, SMS용 `invite_phone` → `20260511120000_merchant_tenant_invite_phone.sql`.

- “연결 삭제”는 **`merchant_tenant_members` 행만** 삭제합니다. Auth 사용자 삭제가 필요하면 Supabase 대시보드에서 처리합니다.

## 6) 당장 권장 운영안

- 이번 주: 병행 운영 + 누락 케이스 수집
- 다음 주: 점주 기본 URL을 `/m/*`로 전환
- 안정화 후: `chaya-menu-test`는 read-only 공지 후 종료

## 7) 운영 템플릿

- 병행 검증은 `docs/MERCHANT_PARALLEL_VALIDATION_CHECKLIST.md`를 tenant별로 복제해 사용하세요.
- 바로 작성 시작하려면 `docs/MERCHANT_PARALLEL_VALIDATION_TEMPLATE.md`를 복사해
  `docs/merchant-validation-<tenant>-<yyyymmdd>.md` 로 저장해 쓰세요.
- 컷오버 전 자동 점검: `npm run cutover:check -- --file docs/merchant-validation-<tenant>-<yyyymmdd>.md`
