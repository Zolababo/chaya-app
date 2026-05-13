# Delivery Progress (Snapshot)

최종 업데이트: 2026-05-13

> **최신 Phase·%는 `docs/MERCHANT_OPERATIONS_ROADMAP.md`** 의 진척도 표와 **「소비자 `/t` — Phase 개요」** 를 따릅니다. 이 파일은 요약 스냅샷입니다.

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

## 다음 마일스톤 (예시)

1. 소비자 **C2**: `pnpm smoke:consumer`, `BARRIER_FREE_EVIDENCE_TEMPLATE.md` 실기기 체크
2. 점주: `MERCHANT_PARALLEL_VALIDATION_CHECKLIST.md` tenant별 병행 기록
3. 결제·직원 호출을 열 때: `future-features` 플래그와 런북 갱신을 같은 PR에 포함
