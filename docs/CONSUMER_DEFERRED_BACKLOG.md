# 소비자·운영 — 보류 백로그 (리마인드용)

**당장 구현하지 않음.** 착수 전에 사용자·팀이 일정을 정할 때까지 이 문서만 갱신한다.

| ID | 항목 | 리마인드 시점 |
|----|------|----------------|
| **C2-MANUAL** | 실기기 수동·접근성 (`docs/CONSUMER_C2_MANUAL_RUNBOOK.md` 3~4단계) | 출시 전 QA 스프린트 |
| **C6** | QR 토큰·점주 주문 중지·rate limit (`docs/QR_AND_GUEST_ORDERS.md` §4) | 남용·장난 주문 이슈 또는 보안 스프린트 |
| **QR-STORE** | 매장별 QR 실제 연결(슬러그·메뉴 DB·인쇄·1회 주문 테스트) | 점주 온보딩·파일럿 매장 확정 시 (`docs/CONSUMER_TENANT_QR_SETUP.md`) |
| **M-STAFF-INVITE** | Owner 앱 내 직원 초대·역할·멤버 RLS·mailto 제거 | **보류** — 파일럿은 **1계정·다기기** (`docs/MERCHANT_ACCOUNT_POLICY.md`) |
| **M-SELF-SIGNUP** | 점주 셀프 가입(`/m/signup`)·슬러그 선점·스팸·승인 정책 | **P2 보류** — `docs/CHAYA_PRODUCT_PRIORITY_PILOT.md` · 영업·`/ops/merchants` 주류인 동안 |
| **M-SAAS-ONBOARD** | 자동 승인·무인 매장 개설·SaaS형 온보딩 | **M-SELF-SIGNUP** 이후 |

**완료(2026-05):** 메뉴 옵션(`options_json`) · 장바구니 더치페이(참고 UI) · C5 이메일 로그인·claim·`list_orders_for_user`.

**완료(2026-05-22):** **M-TABLES** — `tenant_tables` + `/m/{tenant}/tables` CRUD·QR 카드 · 손님 테이블 선택/QR 잠금 · 주문 `tenant_table_is_valid` 검증. DB: `supabase/migrations/20260522120000_tenant_tables.sql` (Supabase에 적용 필요).

**완료(2026-05-22):** **M-TABLES-QR2** — CHAYA 서버 QR 생성(`qrcode`) · 점주 UI 단순화(추가→즉시 QR·인쇄) · 전체 인쇄 `/tables/print` · ZIP `/tables/export`.
