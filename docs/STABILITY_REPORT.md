# Stability Report

- Generated at: 2026-05-06T14:46:38.044Z
- Tenant: demo
- Checklist file: `docs/merchant-validation-demo-20260506.md`

## Consumer Smoke: PASS

```
PASS /health ok: ok=true
PASS /health supabase: configured=true
PASS /health deployment SHA: cc5b1beaf0aa
PASS /robots.txt: contains disallow /m
PASS /t/{tenant} marker: menu page content detected
PASS /t/{tenant}/orders: guest orders hub shell detected
Smoke check passed
```

## Merchant Parallel Smoke: PASS

```
PASS blue merchant url: 200 (attempt 1/5)
PASS green /m/{tenant}/orders: 200 (attempt 1/5)
PASS green /m/{tenant}/menus: 200 (attempt 1/5)
Merchant parallel smoke passed
```

## A11y Baseline: PASS

```
PASS /t/{tenant}: baseline markers detected
PASS /t/{tenant}/barrier-free: baseline markers detected
PASS /t/{tenant}/cart: baseline markers detected
PASS /t/{tenant}/orders: baseline markers detected
A11y baseline check passed
```

## Cutover Readiness: PENDING

```
Cutover readiness check: docs/merchant-validation-demo-20260506.md
Filled order rows: 0
Pending cutover checklist items:
- 최근 3일 연속 핵심 케이스 실패 없음
- 상태 저장 실패 발생 시 5분 내 복구 가능
- 운영 담당자가 Green만으로 업무 수행 가능
- fallback/연락 체계 공지 완료
- 주문 행 기록이 부족합니다 (최소 3건 권장).
```

