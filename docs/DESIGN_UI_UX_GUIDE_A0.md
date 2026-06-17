# 디자인 UI/UX 가이드 (a0) — 참고용

**상태:** 손님·점주 주요 화면 a0 톤 정렬 완료

### 1차 완료 (손님 메뉴판)

- [x] 프라이머리 `#c4613a` (a0 terracotta)
- [x] 메뉴 카드 + 그림자 (`menuCardListClass`)
- [x] 담기 원형 + 아이콘 (`menuAddIconButtonClass`)
- [x] 카테고리 필터 바 (`MenuCategoryChips`)
- [x] 하단 네비 언더라인 (`BottomNav`)

### 2차 — 헤더 (a0 `menu-header`)

- [x] 블러·보더리스 스티키 헤더 (`session-header`)
- [x] 원형 이니셜/로고 44px (`consumer-store-logo`)
- [x] 툴바 ghost 원형 아이콘 (`consumer-header-icon-button`)

### 3차 — 장바구니·메뉴 상세

- [x] 장바구니 카드 행 + a0 수량 버튼 (`cart-checkout-client`, `cartCardItemClass`)
- [x] 메뉴 상세 카드 `rounded-2xl` + 배지 라벨 (`menu/[itemId]/page`)
- [x] 상세 하단 담기 dock 수량 스타일 (`menu-item-add-to-cart`)

### 4차 — 프로모 배너

- [x] `translateX` 트랙 캐러셀, 1/N·도트 (`menu-promo-carousel`)

### 5차 — 점주 메뉴 목록

- [x] 손님과 동일 카드 목록 (`merchant-menu-catalog`)

### 6차 — 주문·로그인·점주 대시보드

- [x] 주문 내역 카드 목록 (`guest-orders-hub`)
- [x] 주문 상세·진행·더치페이 (`orders/[orderId]`, `order-progress-steps`, `split-bill-panel`)
- [x] 오프라인 결제 안내 배너 (`consumer-offline-payment-callout`)
- [x] 로그인·회원가입 폼 카드 (`consumer-login-form`, `consumer-signup-form`)
- [x] 메뉴 하단 장바구니 바 (`menu-cart-sticky-bar`)
- [x] 점주 대시보드·서브내비·미리보기 배너 (`dashboard`, `merchant-subnav`, `merchant-preview-banner`)
- [x] 공통 토큰 (`chayaSurfaceCardClass`, `chayaPrimaryButtonClass` … `menu-list-styles.ts`)

### 7차 — v0 `cart-sheet` · `bottom-nav` (장바구니·주문 탭)

- [x] 하단 탭: a0 dot 인디케이터·아이콘 scale·뱃지 위치 (`bottom-nav.tsx`)
- [x] 장바구니: 시트형 헤더·빈 상태·`h-7` 수량·풀폭 주문하기 푸터 (`cart-checkout-client`, `cart/page`)
- [x] 주문 목록: cart-sheet 카드 스타일 (`guest-orders-hub`)

수신일: 2026-05-19

### 8차 — 장바구니·주문내역 IA (v0 스크린 기준)

- [x] 장바구니: 그립·중복 제목 제거, 세션 헤더(로고·매장·테이블)만 (`cart/page`, `session-header`)
- [x] 장바구니: 「선택한 메뉴 N개」·행 X 삭제·수량 2+ 시 개당 금액·하단 총액+주문 (`cart-checkout-client`)
- [x] 주문내역: 상태 배너·시각·품목·진행/이전 섹션 뱃지 (`guest-order-history-card`, `guest-orders-hub`)
- [x] 주문 카드에서 주문번호·테이블 중복 행 제거
- [x] 하단 탭: 「주문내역」 라벨·주문 건수 뱃지 (`bottom-nav`, `orders-count-event`)

수신일: 2026-05-19

### 9차 — 주문내역 탭 뱃지 (미확인 알림)

- [x] 뱃지 = 주문 성공 시 +1, 주문내역·상세 진입·QR `?table=` 재진입 시 0 (`orders-count-event`, `orders/layout`, `tenant-table-query-sync`)
- [x] 목록 로드·prefetch로 총 건수 덮어쓰기 제거 (`guest-orders-hub`, `bottom-nav`)

수신일: 2026-05-19

## 요약 표

| 항목 | 현재 (CHAYA) | 개선안 (a0) |
|------|----------------|-------------|
| 프라이머리 컬러 | `#c4613a` terracotta | — |
| 담기 버튼 | 원형 + 아이콘 | — |
| 메뉴 카드 | 라운딩 + shadow | — |
| 하단 네비 | 언더라인 | — |
| 카테고리 | 필터 바 | — |

## v0 저장소 연동

- v0 푸시: [Zolababo/v0-github-integration](https://github.com/Zolababo/v0-github-integration) → CHAYA `apps/restaurant-ui` 맞춤 → `consumer-menu` 이식. 절차: **`docs/V0_GITHUB_INTEGRATION_SYNC.md`**

## 코드베이스 연관

- 프라이머리: `apps/consumer-menu` — `chaya-primary`, `globals.css`, `manifest.ts`
- 스타일 토큰: `components/menu-list-styles.ts`
- 헤더: `session-header.tsx`, `consumer-header-toolbar.tsx`
- 프로모: `components/menu-promo-carousel.tsx`
- 장바구니: `app/t/[tenant]/cart/cart-checkout-client.tsx`

## 메모

- 소비자 정책·접근성(44px 터치, 큰글씨 모드)과 충돌 여부는 적용 전에 한 번씩 점검.
- `docs/SALES_UI_PASS_KR.md` 의 de facto 기준과도 맞춰 볼 것.
