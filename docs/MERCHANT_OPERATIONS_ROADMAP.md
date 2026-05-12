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
| 점주 콘솔 운영 성숙도(로드맵 Phase 1–4 통합) | **~94%** | Phase 3 착수: `merchant_notification_events` + 대시보드 피드, 신규 주문·상태 변경 기록, **선택 Resend 이메일**. 웹푸시·카카오 등은 미연동. |
| 소비자 `/t` 주문·메뉴 MVP | **~63%** | 게스트 주문·장바구니·주문 조회 등 핵심 동작. **결제·직원 호출**은 `lib/consumer/future-features` + 서버 라우트 스텁만(당장 미사용). |

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

### Phase 3 — 알림 (진행 중)

- ✅ DB **`merchant_notification_events`** + RLS(승인 멤버·`platform_operators` SELECT).
- ✅ **대시보드「최근 알림」** — 신규 손님 주문·주문 상태 변경 기록, 메일 발송 여부 뱃지.
- ✅ **Resend(선택)** — `RESEND_API_KEY`·`RESEND_FROM_EMAIL` + 멤버 `invite_email` 있을 때만 신규 주문 메일.
- ✅ **멤버별 `notify_order_email`(DB)** — 기본 true, Resend 수신자 조회 시 `true` 인 멤버만. 마이그레이션 `20260512210000_*` 적용 필요. **운영 UI 토글은 다음 단계.**
- ⬜ 웹 푸시 / 카카오 / **`notify_order_email` UI(`/ops/merchants` 등)**.

#### SQL 적용 후 권장 순서

1. **마이그레이션** — `20260512200000_merchant_notification_events.sql` 및 **`20260512210000_merchant_tenant_members_notify_order_email.sql`** 이 프로젝트에 반영됐는지 확인.
2. **앱 배포** — `main` 최신이 Vercel(또는 호스트)에 올라가 있는지 확인.
3. **`GET /health`** — `supabase.merchantDbReady` 가 true 인지, `merchantOrderEmail.resendConfigured` / `siteUrlForMailLinks` 로 메일 준비 상태만 확인(비밀 미노출).
4. **동작 확인** — 손님 `/t/{tenant}` 에서 테스트 주문 → 점주 `/m/{tenant}/dashboard` 의 **최근 알림**에 `guest_order_created` 가 보이는지.
5. **이메일(선택)** — Vercel 등에 `RESEND_API_KEY`, `RESEND_FROM_EMAIL` 설정 후 재배포. 멤버 행에 **`invite_email`** 이 있는지(`/ops/merchants` 초대) 확인.
6. **링크 품질** — 메일 안 주문 큐 URL을 절대 경로로 쓰려면 **`NEXT_PUBLIC_SITE_URL`** 권장(없으면 `VERCEL_URL` 사용).

### Phase 4 — 권한·거버넌스

- `owner` / `staff` 이상의 **세분 역할**(예: 정산만, 메뉴만).
- **변경 불가 필드**·위험 작업에 대한 2인 승인 등(필요 시).

## 제한 사항

- 감사 insert는 **DB 마이그레이션 적용 전**에는 로그만 남고 저장은 실패할 수 있습니다.
- 장기 보관·변조 방지는 DB 백업·WORM 스토리지 등 **인프라 정책**과 함께 검토합니다.
