# Next 5 Steps - Execution Log

최종 업데이트: 2026-05-06

## Step 1. Blue/Green 병행 점검 시작

- 상태: **진행 준비 완료**
- 결과물: `docs/merchant-validation-demo-20260506.md` (3일치 슬롯 확장)

## Step 2. 병행 중 발견 이슈 수정/재검증 루프

- 상태: **실행 체계 준비 완료**
- 결과물: `docs/MERCHANT_PARALLEL_VALIDATION_CHECKLIST.md`, `docs/MERCHANT_PARALLEL_VALIDATION_TEMPLATE.md`

## Step 3. 점주 전환 공지/Go-NoGo 확정 준비

- 상태: **준비 완료**
- 결과물: `docs/MERCHANT_CUTOVER_NOTICE_TEMPLATE.md`

## Step 4. 데모 read-only 전환/종료 절차

- 상태: **준비 완료**
- 결과물: `docs/MERCHANT_CUTOVER_NOTICE_TEMPLATE.md` (read-only 공지 포함)

## Step 5. 소비자앱 잔여 검증(추가 인스턴스 + 접근성 수동)

- 상태: **실행 준비 완료**
- 결과물: `docs/CONSUMER_STAGING_VERIFICATION.md`
- 참고: 접근성 실기기 검증은 현장 실행 필요

## 안정성 자동화 추가 (2026-05-06)

- `scripts/smoke-platform.mjs` 추가 (소비자 + 점주 병행 스모크 통합)
- `npm run smoke:platform -- --tenant demo` 실행 가능
- `.github/workflows/smoke-platform.yml` 추가 (수동/일정/CI 성공 후 자동 점검)
- 점주 스모크 재시도/마커 검증 추가 (`--merchant-retries`, `--merchant-retry-delay-ms`)
- 컷오버 준비 자동 판정 스크립트 추가 (`npm run cutover:check`)
- 안정성 리포트 생성 스크립트 추가 (`npm run stability:report`)
- 안정성 사이클 일괄 실행 추가 (`npm run stability:cycle`) + GitHub `stability-cycle` 워크플로우
