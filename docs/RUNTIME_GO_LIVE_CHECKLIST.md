# 런타임·모바일 가동 점검표 (소비자 / 점주 / 플랫폼)

한 도메인에 세 경로가 함께 있습니다: **`/t/*`(손님)·`/m/*`(점주)·`/ops/*`(운영)**. Vercel·Supabase 세팅과 모바일 접속을 한 번에 확인할 때 사용합니다.

---

## 1. Vercel 환경변수 (Production·Preview에 맞게 복제)

| 변수 | 소비자 `/t/*` | 점주 `/m/*` | 플랫폼 `/ops/*` |
|------|:--:|:--:|:--:|
| `NEXT_PUBLIC_SUPABASE_URL` | 필수 | 필수 | 필수 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 필수 | 필수 | 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` 또는 `SUPABASE_SECRET_KEY` | 선택(일부 서버 기능) | **필수**(주문·메뉴 서버 작업) | **필수**(점주 계정 생성 `auth.admin`) |
| `NEXT_PUBLIC_SITE_URL` | 권장(메타·공유 URL 고정) | 동일 | 동일 |

- 값 저장 후 **재배포**해야 런타임에 반영됩니다.
- 과거 `MERCHANT_ORDERS_TOKEN` 은 **미사용**(삭제 유지).

---

## 2. Supabase (동일 프로젝트)

### Auth

- **Authentication → Providers**: Email 사용.
- **Authentication → URL configuration**: **Site URL** 을 실제 배포 호스트로 (예: `https://your-app.vercel.app`).
- 점주·플랫폼 모두 같은 프로젝트 계정을 씁니다.

### DB 마이그레이션(요약)

손님 주문 등은 기존 레포 마이그레이션 순서를 따르고, 점주·플랫폼에 필요한 것은 최소:

- `20260510183000_merchant_tenant_members.sql` — 점주 매장 연결
- `20260510210000_platform_operators.sql` — `/ops` 운영자

첫 **플랫폼** 운영자: Auth로 사용자 만든 뒤 `platform_operators` 에 `user_id` 삽입.  
첫 **점주**: `/ops/merchants` 에서 초대하거나, SQL로 `merchant_tenant_members` 삽입.

자세한 절차: `docs/MERCHANT_MIGRATION_RUNBOOK.md`, 손님 RPC 점검: `supabase/scripts/verify_guest_order_rpcs.sql`.

---

## 3. 모바일에서 빠른 동작 확인

같은 배포 URL을 **휴대폰 브라우저**(Safari / Chrome)로 열어 확인합니다.

| 앱 | 예시 URL | 기대 |
|----|----------|------|
| 소비자 | `/t/demo` | 메뉴·장바구니·하단 탭, 홈 인디케이터와 겹치지 않게 스크롤 |
| 점주 | `/m/login` → `/m/demo/orders` | 로그인 후 주문 큐, 가로 스크롤 테이블 |
| 플랫폼 | `/ops/login` → `/ops/merchants` | 로그인 후 목록·초대 폼 |

- **뷰포트·홈 화면 메타**: 루트 `layout`·`app/manifest.ts` 에서 모바일·테마 힌트 적용.
- 네트워크: 사내 Wi‑Fi에서 DNS/방화벽이 `*.supabase.co` 를 막지 않는지 확인.

---

## 4. 실패 시 자주 나오는 원인

- **점주 로그인만 실패**: `merchant_tenant_members` 행 없음, 이메일 미인증, anon 키 누락.
- **주문/메뉴 API 실패**: `SUPABASE_SERVICE_ROLE_KEY` 누락 또는 마이그레이션 미적용.
- **플랫폼 초대 실패**: service role 없음, 또는 본인이 `platform_operators` 에 없음.
- **모바일에서만 이상**: `NEXT_PUBLIC_SITE_URL` 과 Supabase Site URL 불일치, 혼합 콘텐츠(http) 여부 확인.
