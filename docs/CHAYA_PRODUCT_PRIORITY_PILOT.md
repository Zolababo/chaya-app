# CHAYA 제품 우선순위 (파일럿·MVP 단계)

**최종 정리:** 2026-06-01 (계정 정책 갱신)  
**전제:** 매장 네트워크가 아직 형성되지 않은 **초기 파일럿 이전** 단계. Shopify·Notion 수준의 셀프 온보딩 최적화보다 **MVP 검증·핵심 데이터**에 집중한다.

**관련:** `docs/MERCHANT_ACCOUNT_POLICY.md` · `docs/MERCHANT_ACCOUNT_PASSWORD.md` · `docs/MERCHANT_FIELD_ONBOARDING.md` · `docs/CHAYA_EXPERIENCE_DATA.md` · `docs/MERCHANT_OPERATIONS_ROADMAP.md`

---

## 제품 관점 (한 줄)

장기 경쟁력의 핵심 자산은 **점주 계정·직원 RBAC**보다 **소비자 행동 데이터 축적**이다.

- `guest_session_id` 기반 익명 방문자
- 방문·재방문·주문 이력 (`consumer_experience_events`, `orders`)
- 향후 **`store_visit`** 등 방문 단위 모델 설계

---

## 점주 계정 정책 (파일럿 — 확정)

**매장당 계정 1개 + 여러 기기 동시 로그인.**  
상세: **`docs/MERCHANT_ACCOUNT_POLICY.md`**

| 예시 기기 | 동일 이메일·비밀번호로 `/m/login` |
|-----------|-----------------------------------|
| 사장님 폰 | ✅ |
| 매장 태블릿 | ✅ |
| 주방 태블릿 | ✅ |

**당분간 만들지 않음:** 직원 초대, 멤버별 RLS/UI, 초대 메일, 앱 내 승인·삭제, 직원용 감사·mailto 직원 요청.

---

## 구현 순서 (ROI 기준)

| 순서 | 묶음 | 상태 | 내용 |
|------|------|------|------|
| **1** | **P0 — 점주 계정 기본** | ✅ | 비밀번호 찾기·변경·로그아웃 안내 — `docs/MERCHANT_ACCOUNT_PASSWORD.md` |
| **2** | **소비자 방문 데이터** | 🔲 | `store_visit` 설계 등 — `docs/CHAYA_EXPERIENCE_DATA.md` |
| **3** | **P2 — 셀프 가입** | ⏸️ | 영업·Ops 온보딩 주류일 때 후순위 |
| **4** | **SaaS형 온보딩** | ⏸️ | 자동 승인·무인 매장 개설 |

| ~~P1~~ | ~~Owner 직원 초대~~ | ⏸️ **취소·보류** | **1계정·다기기** 정책으로 대체 — `M-STAFF-INVITE` |

**Ops 초대·승인** (`/ops/merchants`)은 **소장 첫 계정**용으로 파일럿 동안 유지.

---

## P0 — 점주 계정 기본 ✅

| 항목 | 비고 |
|------|------|
| 비밀번호 찾기·재설정 | `/m/forgot-password` · `/m/auth/confirm` |
| 비밀번호 변경 | `/m/{tenant}/more/account` |
| 로그인/로그아웃 | `?ok=logged_out` · `?reauth=1` |
| 다기기 | 별도 기능 없음 — 동일 계정으로 기기마다 로그인 (정책 문서) |

---

## ~~P1 — Owner 직원 초대~~ (보류)

파일럿에서는 **구현하지 않음.**  
직원별 계정·역할 분리는 매장 수·운영 모델이 커진 뒤 `M-STAFF-INVITE` 로 재검토.

---

## P2 — 셀프 가입 (보류)

- 초기 유입은 영업·`/ops/merchants`
- 슬러그 선점·스팸·승인 정책 비용

---

## 소비자 방문 데이터 (순서 2)

| 자산 | 현재 | 다음 |
|------|------|------|
| 익명 방문자 | `guest_session_id` | 유지 |
| 이벤트 | `qr_scan`, `revisit`, `order_placed` | `CHAYA_EXPERIENCE_DATA.md` |
| 방문 단위 | 없음 | `store_visit` 설계 |

---

## 에이전트·PR 가이드

1. 「비밀번호」「계정」→ **P0** · **MERCHANT_ACCOUNT_POLICY** (1계정·다기기).
2. 「직원 초대」「mailto 직원」→ **보류** 안내 — **다기기 로그인** 정책 제안.
3. 「점주 가입」→ **P2 보류**.
4. 「방문 데이터」「store_visit」→ **순서 2**.
5. C6·C2 수동·QR-STORE — `CONSUMER_DEFERRED_BACKLOG.md` 유지.

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-01 | 파일럿 우선순위 확정 (P0 → P1 → 데이터 → P2) |
| 2026-06-01 | **P1 직원 초대 취소** — 1계정·다기기 정책 (`MERCHANT_ACCOUNT_POLICY.md`), 다음은 방문 데이터 |
