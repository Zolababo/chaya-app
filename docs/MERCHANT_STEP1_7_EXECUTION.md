# Merchant Step 1-7 Execution (Demo)

기준 tenant: `demo`  
실행일: 2026-05-06

## 실행 결과 요약

1. 병행 검증표 준비/확장: **완료**
2. Day1 이슈 즉시 대응 루프 템플릿: **완료**
3. Day2 반복 실행 슬롯: **완료**
4. Day3 판정 체크리스트: **완료**
5. 점주 전환 공지 초안: **완료**
6. `/m/{tenant}` 공식 URL + fallback 운영안: **완료**
7. 데모 read-only 전환/종료 공지안: **완료**

## 자동 검증(오늘 수행)

- `https://chaya-app.vercel.app/m/demo/orders` -> 200
- `https://chaya-app.vercel.app/m/demo/menus` -> 200
- `https://chaya-menu-test.vercel.app/` -> 200
- `npm run smoke:consumer -- --tenant demo` -> PASS
- `npm run smoke:merchant -- --tenant demo` -> PASS

## 운영팀이 이어서 채워야 하는 항목(현장 실행)

- Day1~Day3 주문 실제 생성/상태 변경 결과 표 기록
- 누락/지연 케이스 발생 시 원인/임시대응/영구대응 링크 기록
- 3일치 기록 완료 후 Go/No-Go 체크

## 사용 문서

- 병행 검증표: `docs/merchant-validation-demo-20260506.md`
- 전환 런북: `docs/MERCHANT_MIGRATION_RUNBOOK.md`
- 공지 템플릿: `docs/MERCHANT_CUTOVER_NOTICE_TEMPLATE.md`
