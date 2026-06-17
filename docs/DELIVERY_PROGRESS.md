# Delivery Progress (Snapshot)

최종 업데이트: 2026-06-01

> **최신 Phase·%는 `docs/MERCHANT_OPERATIONS_ROADMAP.md`** 의 진척도 표와 **「소비자 `/t` — Phase 개요」** 를 따릅니다.  
> **파일럿 단계 구현 순서(P0→방문 데이터→P2):** `docs/CHAYA_PRODUCT_PRIORITY_PILOT.md` · 계정 정책 `docs/MERCHANT_ACCOUNT_POLICY.md`

## 앱별 진도율 (요약)

- 소비자앱 (`/t/*`): **~63%** (`MERCHANT_OPERATIONS_ROADMAP` 기준, MVP 중심·결제·직원호출 제외)
- 점주앱 (`/m/*`): **~99%** (동 문서, Phase 1–4 통합)

## 소비자 — Phase 한눈에

| Phase | 요지 |
|-------|------|
| C1 MVP | 메뉴·장바구니·게스트 주문·조회·barrier-free·RPC — 상세는 `BARRIER_FREE_NEXT_STEPS.md` |
| C2 검증 | 스모크·접근성·추가 DB 검증 반복 |
| C3 결제 | `lib/consumer/future-features` 스텁 (미구현) |
| C4 직원 호출 등 | 스텁 (미구현) |
| C5 (선택) | 로그인·`consumer-log` — `ARCHITECTURE.md` |

## 다음 마일스톤 (파일럿 우선순위)

1. **P0** — 점주 비밀번호 찾기·변경, `/m/login`·`/m/logout` 안정화 (`CHAYA_PRODUCT_PRIORITY_PILOT.md`)
2. **방문 데이터** — `store_visit` 설계 · `CHAYA_EXPERIENCE_DATA.md` 로드맵
3. **점주 계정** — 1계정·다기기 (`MERCHANT_ACCOUNT_POLICY.md`) — 직원 초대(P1) 없음
4. 소비자 **C2** 수동·실매장 (`CONSUMER_C2_MANUAL_RUNBOOK.md`) — 보류 리마인드 유지
5. **P2 셀프 가입·SaaS 온보딩** — 채널 성숙 후 (`CONSUMER_DEFERRED_BACKLOG.md` **M-SELF-SIGNUP**, **M-SAAS-ONBOARD**)
