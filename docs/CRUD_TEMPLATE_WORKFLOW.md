# CRUD Template Workflow (Merchant Domain)

목표: 반복되는 점주 CRUD 화면 구현 속도를 높이면서 구조 일관성을 유지합니다.

## 1) 생성 명령

- 메뉴 템플릿 생성: `npm run crud:menu`
- 카테고리 템플릿 생성: `npm run crud:category`
- 일반 리소스 생성: `npm run crud:generate -- <resource-name>`

생성 위치:

- `apps/consumer-menu/components/crud/<resource>/`

## 2) menu/category 전용 필드

`menu`
- `tenant_slug`, `name`, `price`
- `category`, `description`, `imageUrl`
- `sort_order`, `is_sold_out`

`category`
- `tenant_slug`, `name`
- `sort_order`, `is_active`

## 3) 통합 방식

1. 생성된 `*Form.tsx`를 페이지 UI 뼈대로 사용
2. 기존 server action(`actions.ts`)과 `FormData` 이름을 맞춰 연결
3. 권한 검증은 기존 guard를 그대로 사용
4. 페이지 메시지는 `?e=`/`?ok=` 규칙 유지

## 4) 주의사항

- 생성 템플릿은 시작점이며, 실제 비즈니스 검증은 `actions.ts`에서 확정
- 상태 변경 동작(삭제/로그아웃 등)은 GET에 두지 않음
- DB/RLS 전제 변경 시 runbook과 체크리스트를 함께 갱신
