# Merchant Migration Runbook (Demo -> `/m/*`)

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

- 통합 점주앱 접근 토큰: `MERCHANT_ORDERS_TOKEN`
- 1회 진입 URL 예시: `/m/{tenant}/orders?token=...`
- 선택: `NEXT_PUBLIC_LEGACY_MERCHANT_URL`을 설정하면 `/m/*` 안내 배너에 기존 데모 링크를 노출해
  병행 운영 중 fallback 동선으로 사용할 수 있습니다.

## 6) 당장 권장 운영안

- 이번 주: 병행 운영 + 누락 케이스 수집
- 다음 주: 점주 기본 URL을 `/m/*`로 전환
- 안정화 후: `chaya-menu-test`는 read-only 공지 후 종료

## 7) 운영 템플릿

- 병행 검증은 `docs/MERCHANT_PARALLEL_VALIDATION_CHECKLIST.md`를 tenant별로 복제해 사용하세요.
- 바로 작성 시작하려면 `docs/MERCHANT_PARALLEL_VALIDATION_TEMPLATE.md`를 복사해
  `docs/merchant-validation-<tenant>-<yyyymmdd>.md` 로 저장해 쓰세요.
- 컷오버 전 자동 점검: `npm run cutover:check -- --file docs/merchant-validation-<tenant>-<yyyymmdd>.md`
