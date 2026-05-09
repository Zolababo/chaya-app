# Barrier-Free Certification Track

정부기관 인증/승인을 목표로 할 때, 현재 상태와 남은 필수 항목을 분리해 추적합니다.

## 현재 상태 (요약)

- 앱 접근성 보강과 운영 스모크는 구축됨
- `a11y:baseline` 회귀 점검 자동화 도입
- 단, 이는 **인증 대체 수단이 아님** (회귀 방지용 안전장치)

## 인증 목표 관점의 필수 항목

1. **기준 고정**
   - 적용 기준(KWCAG 2.1 AA 등)과 심사 범위(화면/동선) 문서화
2. **실사용자 테스트**
   - 장애 유형별(시각/지체 등) 실제 사용자 시나리오 테스트 기록
3. **전문기관 사전 진단**
   - 외부 진단 보고서(문제 항목/심각도/재현 절차) 수령
4. **시정조치 및 재검증**
   - 이슈별 수정 + 재테스트 증적 관리
5. **공식 심사 대응**
   - 심사 제출 산출물(화면 목록, 체크리스트, 테스트 기록) 준비

## 이번 스프린트 완료 기준(권장)

- [ ] 핵심 주문 동선(메뉴 -> 장바구니 -> 주문 -> 주문현황) 실사용자 테스트 1회차 완료
- [ ] 외부 진단 요청 범위 확정
- [ ] 인증 증적 템플릿 초안 작성

## 운영 명령

```bash
npm run a11y:baseline -- --tenant demo
npm run stability:cycle -- --tenant demo --checklist-file docs/merchant-validation-demo-20260506.md --out-file docs/STABILITY_REPORT.md
npm run cert:pack
npm run cert:pack -- --strict
```
