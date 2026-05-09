# Consumer Staging Verification

운영 외 추가 인스턴스(스테이징 등) 검증용 빠른 체크리스트입니다.

## 1) Supabase SQL 확인

`supabase/scripts/verify_guest_order_rpcs.sql` 실행 후 아래를 체크:

- [ ] ① RPC 3종 존재
- [ ] ② `get_order_for_guest` / `get_order_status_for_guest` 시그니처 `uuid, text, text`
- [ ] ③ `orders` 주요 컬럼 존재
- [ ] ④ `orders` RLS 활성화
- [ ] ⑤ `anon`(및 필요 시 `authenticated`) EXECUTE 권한 존재

## 2) 앱 스모크

```bash
npm run smoke:consumer -- --tenant <tenant_slug>
```

- [ ] `/health` OK
- [ ] `/t/{tenant}` 메뉴 페이지 OK
- [ ] `/t/{tenant}/orders` 주문 허브 OK

## 3) 수동 동선

- [ ] 메뉴 담기 -> 주문 생성
- [ ] 주문 상세 링크 열기
- [ ] 주문 상태 폴링 갱신 확인
- [ ] 시크릿 창/다른 기기 접근 제한 확인
