# 점주 콘솔 운영 성숙도 로드맵

앱 배포(Vercel 등)와 DB 마이그레이션(Supabase)은 **별도 단계**입니다. 코드가 `main`에 올라가도, 아래 SQL이 프로젝트에 적용되어야 런타임에서 감사 로그 insert가 성공합니다.

## 배포 체크리스트

1. **Git push** — 원격 저장소에 반영되면 연결된 프론트 배포(Vercel)가 빌드됩니다.
2. **Supabase** — `supabase/migrations/` 의 최신 파일을 스테이징/프로덕션 DB에 적용합니다.  
   - CLI: `supabase db push` (또는 대시보드 SQL / CI 파이프라인)
3. **환경 변수** — `SUPABASE_SERVICE_ROLE_KEY` 가 Vercel(서버)에 설정되어 있어야 주문·메뉴 변경 및 감사 로그 기록이 동작합니다.

## 진척도(대략, 코드·구조 기준)

| 영역 | 비율 | 비고 |
|------|------|------|
| 점주 콘솔 운영 성숙도(로드맵 Phase 1–4 통합) | **~99%** | Phase 4: 역할 5종(owner·staff·menu_editor·viewer·finance) + 메뉴 삭제 owner 전용 + 조회 전용 푸시 차단. 남음: 2인 승인·추가 세분(필요 시), 운영 설정(VAPID 등). |
| 소비자 `/t` 주문·메뉴 MVP | **~63%** | 게스트 주문·장바구니·주문 조회 등 핵심 동작. **결제·직원 호출은 의도적으로 미구현** — `lib/consumer/future-features` 플래그·타입과 `POST …/checkout/payment`·`POST …/staff-call` 스텁(501)만 두어 이후 기능을 같은 경로에 붙일 수 있게 함. |

### 소비자 `/t` — Phase 개요 (점주와 별도 축)

점주 쪽처럼 **이 파일 하나에 Phase만 총정리되어 있지는 않습니다.** 손님 주문·접근성·RPC 순서는 **`docs/BARRIER_FREE_NEXT_STEPS.md`**, QR·게스트 흐름은 **`docs/QR_AND_GUEST_ORDERS.md`**, UI 이식 기준은 **`docs/STITCH_TO_APP_MAP.md`** 등에 나뉘어 있습니다. 아래는 **같은 레포 안에서** 작업 우선순위를 묶은 개념적 Phase입니다.

| Phase | 이름 | 상태 | 내용 |
|-------|------|------|------|
| **C1** | 메뉴·게스트 주문 MVP | ✅ | `/t/[tenant]` 메뉴, 장바구니, 주문 제출·조회, `barrier-free`, 게스트 RPC·RLS (마이그레이션 순서는 `BARRIER_FREE_NEXT_STEPS`) |
| **C2** | 신뢰·검증·하드닝 | 진행/반복 | `pnpm smoke:consumer`(장바구니·편한 메뉴·GET 405·`/health` 게스트 RPC 프로브), 실기기 접근성, `verify_guest_order_rpcs.sql`, `HARDENING_ORDER` 계열 |
| **C3** | 결제 | ⏸️ 의도적 보류 | `future-features` + `POST …/checkout/payment` 스텁(501); PG 붙일 때 구현 |
| **C4** | 직원 호출·부가 | ⏸️ 의도적 보류 | `POST …/staff-call` 스텁, 헤더 버튼 비활성 |
| **C5** | (선택) 로그인·소셜 | 미착수 | `ARCHITECTURE.md` — `consumer-log`, 소비자 로그인 시점 등 장기 |

**`docs/DELIVERY_PROGRESS.md`** 에는 예전 스냅샷(88% 등)이 남아 있을 수 있으니, **진척 숫자는 이 표(위 `~63%`)와 본 문서의 Phase 표를 기준**으로 보는 것을 권장합니다.

숫자는 펜테스트·실매장 검증 없이 **저장소와 흐름 기준 추정**입니다. 이후 작업 마칠 때마다 이 표를 갱신합니다.

## 단계별 계획

### Phase 1 — 기반 ✅

- `/m/[tenant]/*` **공통 레이아웃**에서 `requireMerchantForTenant` 로 테넌트 가드 일원화.
- **`react` `cache()`** 로 동일 요청 내 레이아웃+페이지의 멤버십 조회 중복 제거.
- **`merchant_audit_events` 테이블** + RLS(멤버 SELECT, 서버는 service role로 INSERT).
- **주문 상태 변경·메뉴 CRUD** 성공 시 감사 이벤트 기록(비차단).
- 스태프가 메뉴 URL로 들어올 때 리다이렉트되는 `?e=no_menus_access` 를 **대시보드에서 안내**.

### Phase 2 — 관측·운영 ✅

- ✅ `/m/[tenant]/audit` **감사 로그 조회 UI** — 세션 클라이언트 + RLS, 액션 필터, 페이지네이션(25건).
- ✅ **기간 필터**(KST 달력일, 최대 120일) 및 **CSV** — `GET /m/[tenant]/audit/export` (동일 필터, 최대 5,000건, 초과 시 `X-Audit-Export-Truncated`).
- ✅ 플랫폼 **`/ops/audit`** — 전 매장 조회·필터·CSV (`GET /ops/audit/export`). DB에 `merchant_audit_events_select_platform_operator` 정책 필요(`20260512160000_*` 마이그레이션).
- ✅ **`/ops/merchants` 운영 액션 감사** — 초대·승인·연결 삭제·주문 메일 토글 성공 시 `merchant_audit_events`에 기록(액션 접두사 `ops.`; 이메일·전화·비밀번호는 detail에 넣지 않음). `SUPABASE_SERVICE_ROLE_KEY` 필요.

### Phase 3 — 알림 ✅

- ✅ DB **`merchant_notification_events`** + RLS(승인 멤버·`platform_operators` SELECT).
- ✅ **대시보드「최근 알림」** — 신규 손님 주문·주문 상태 변경 기록, 메일 발송 여부 뱃지.
- ✅ **Resend(선택)** — `RESEND_API_KEY`·`RESEND_FROM_EMAIL` + 멤버 `invite_email` 있을 때만 신규 주문 메일.
- ✅ **멤버별 `notify_order_email`** — DB(기본 true) + Resend 필터 + **`/ops/merchants`에서 운영자 토글**(POST 서버 액션). 마이그레이션 `20260512210000_*` 적용 필요.
- ✅ **신규주문 Resend 쿨다운** — 매장당 3분(인스턴스 메모리, 서버리스 한계 있음).
- ✅ **웹 푸시** — VAPID + `merchant_push_subscriptions`(마이그레이션 `20260512220000_*`) + 대시보드에서 기기 구독; 신규 주문 시 `web-push` 발송(만료 구독 410/404 시 삭제). Resend·웹훅과 동일 **매장당 3분 쿨다운** 묶음.
- ✅ **외부 알림 웹훅(카카오 등 연동용)** — `MERCHANT_ORDER_NOTIFY_WEBHOOK_URL`(+선택 `MERCHANT_ORDER_NOTIFY_WEBHOOK_SECRET`) 설정 시 신규 주문 JSON POST. 실제 알림톡은 별도 서비스·템플릿에서 처리.

#### SQL 적용 후 권장 순서

1. **마이그레이션** — `20260512200000_merchant_notification_events.sql`, **`20260512210000_merchant_tenant_members_notify_order_email.sql`**, **`20260512220000_merchant_push_subscriptions.sql`**, **`20260513190000_merchant_tenant_members_phase4_roles.sql`**, **`20260514100000_merchant_tenant_members_finance_role.sql`** 가 프로젝트에 반영됐는지 확인.
2. **앱 배포** — `main` 최신이 Vercel(또는 호스트)에 올라가 있는지 확인.
3. **`GET /health`** — `supabase.merchantDbReady` 가 true 인지, `merchantOrderEmail.resendConfigured` / `siteUrlForMailLinks` 로 메일 준비 상태만 확인(비밀 미노출). 점주 역할·역할용 마이그레이션 파일명 힌트는 `supabase.merchantMemberRoles` 를 참고.
4. **동작 확인** — 손님 `/t/{tenant}` 에서 테스트 주문 → 점주 `/m/{tenant}/dashboard` 의 **최근 알림**에 `guest_order_created` 가 보이는지.
5. **이메일(선택)** — Vercel 등에 `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 설정 후 재배포. 멤버 행에 **`invite_email`** 이 있는지(`/ops/merchants` 초대) 확인.
6. **링크 품질** — 메일 안 주문 큐 URL을 절대 경로로 쓰려면 **`NEXT_PUBLIC_SITE_URL`** 권장(없으면 `VERCEL_URL` 사용).

### Phase 4 — 권한·거버넌스 (진행 중)

- ✅ DB **`merchant_tenant_members.role`** — `menu_editor`(메뉴 편집·품절 등, 삭제 제외; 주문 조회만), `viewer`·`finance`(조회 전용: 주문 상태·푸시 구독 불가; `finance`는 정산 구분용으로 viewer와 동일 권한). 마이그레이션 `20260513190000_*`, `20260514100000_*`.
- ✅ 앱 — `lib/merchant/merchant-role-capabilities.ts` + 주문·메뉴 서버 액션·대시보드 푸시·`/ops/merchants` 초대 역할 선택.
- ✅ **위험 작업 분리** — 메뉴 **삭제**는 `owner` 만; `menu_editor` 는 추가·수정·품절·이미지 등만 (`canDeleteMerchantMenu`).
- **남음(선택):** 더 세분 역할(예: 매장별 커스텀), 변경 불가 필드·위험 작업 **2인 승인** 등.

## 제한 사항

- 감사 insert는 **DB 마이그레이션 적용 전**에는 로그만 남고 저장은 실패할 수 있습니다.
- 장기 보관·변조 방지는 DB 백업·WORM 스토리지 등 **인프라 정책**과 함께 검토합니다.
