# 스티치 화면 → 앱 라우트·컴포넌트 매핑

Google Stitch로 잡은 **매장 QR 주문** UI를 `consumer-menu` 앱에 옮길 때의 기준표다.  
테넌트는 URL에 `{tenant}` (slug 또는 short code)가 들어간다고 가정한다.

---

## 1. 라우트 매핑

| 스티치 화면 | 제안 경로 | 설명 |
|-------------|-----------|------|
| 메뉴 홈 (카테고리 슬라이더 + 벤토 그리드) | `/t/[tenant]` 또는 `/t/[tenant]/menu` | QR 진입 기본. 카테고리·메뉴 목록. |
| 메뉴 상세·옵션 (수량, 라디오, 스파이스 등) | `/t/[tenant]/menu/[itemId]` | 단일 메뉴 클릭 후 커스터마이즈. |
| 주문 확인·장바구니 (더치페이 포함) | `/t/[tenant]/cart` | 라인 아이템·요약·분할 계산·전송 CTA. |
| 주문 접수 후·진행 안내 | `/t/[tenant]/orders/[orderId]` 또는 `/t/[tenant]/status` | 접수 직후는 `orderId`가 있으면 상세, 없으면 최근 주문으로 리다이렉트 정책 결정. |

**쿼리로 테이블 번호를 붙이는 경우 (선택)**  
- `/t/[tenant]?table=08` — Stitch의 “Table 08”과 동일하게 헤더에 표시.

---

## 2. 화면별 UI 블록 → 컴포넌트 (제안 이름)

공통 프리픽스: `Consumer` 또는 접두사 없이 `Menu*` — 팀 규칙에 맞춰 하나로 통일.

### 2.1 메뉴 홈

| UI 블록 | 컴포넌트 제안 | 비고 |
|---------|----------------|------|
| 상단 고정 바 | `TenantHeader` 또는 `SessionHeader` | 테이블 번호, 언어, 직원 호출, 알림 자리 |
| 정보 배너 | `InfoBanner` | Self-Bar 등 매장 안내 (CMS 또는 테넌트 설정) |
| 가로 카테고리 칩 | `CategoryRail` | 스크롤 영역, 선택 상태 |
| 메뉴 카드 그리드 | `MenuItemCard` × N | 이미지, 배지, 제목, 설명, 가격, 담기 |
| 하단 탭 바 | `BottomNav` | Menu / Cart / Order Status — 현재 탭 활성 |

### 2.2 메뉴 상세·옵션

| UI 블록 | 컴포넌트 제안 | 비고 |
|---------|----------------|------|
| 상단 바 | `DetailHeader` | 뒤로, 테이블/언어, 알림 |
| 히어로 이미지 + 제목·가격·설명 | `MenuItemHero` | |
| 알레르기·식단 칩 | `DietaryChips` | Vegan, Halal 등 |
| 수량 스테퍼 | `QuantityStepper` | 접근성: `aria-valuenow`, 버튼 라벨 |
| 옵션 그룹 (라디오) | `OptionGroup` + `OptionCard` | `fieldset`/`legend` 대응 |
| 스파이스 등 아이콘 라디오 | `IconOptionGroup` | 동일 패턴 재사용 |
| 하단 고정 | `StickyCartBar` | 합계 + Add to Cart |

### 2.3 주문 확인 (장바구니)

| UI 블록 | 컴포넌트 제안 | 비고 |
|---------|----------------|------|
| 헤더 | `CartHeader` | Stitch 3번째 화면 variant |
| 라인 아이템 | `CartLineItem` | 썸네일, 옵션 텍스트, 수량, 삭제 |
| 요약 카드 | `OrderSummary` | Subtotal, 수수료, 세금, Total |
| 더치페이 | `SplitBillPanel` | 인원 수 스테퍼, 1인 금액 |
| 알레르기 고지 칩 | `OrderMetaChips` | 주문 단위 안내 |
| 하단 전송 | `SendOrderButton` | “SEND ORDER TO KITCHEN” |
| 하단 네비 | `BottomNav` | Cart 활성 |

### 2.4 주문 현황·안내

| UI 블록 | 컴포넌트 제안 | 비고 |
|---------|----------------|------|
| 접수 완료 헤더 | `OrderConfirmation` | 주문 번호 문구 |
| 진행 단계 인디케이터 | `OrderProgressSteps` | Confirmed / Preparing / Serving |
| 예상 대기 시간 | `WaitTimeEstimate` | |
| 안내 카드 (지도/플랜) | `SelfBarMapCard` | 이미지+오버레이 문구 |
| 빠른 액션 | `QuickActionTile` × N | 리필, 직원 호출 등 |
| 하단 네비 | `BottomNav` | Order Status 활성 |

---

## 3. 공유 레이아웃

| 역할 | 제안 |
|------|------|
| 테넌트·테이블 컨텍스트 | `TenantProvider` + `SessionContext` (guest_session_id, table) |
| 디자인 토큰 | Stitch의 Tailwind extend 색·spacing·타이포 → `packages/ui` 또는 테마 CSS 변수 |
| 하단 안전 영역 | `pb-safe` 유틸 유지 |

---

## 4. 다음 구현 순서 (참고)

1. ~~`BottomNav` + `SessionHeader`~~ ✅ (`bottom-nav.tsx`, `session-header.tsx`)  
2. ~~메뉴·카트·주문 데이터 연동~~ ✅ (`MenuBoard`, `CartCheckoutClient`, 게스트 RPC)  
3. ~~주문 현황 진행 UI~~ ✅ (`OrderProgressSteps`, `GuestOrderStatusLive`)  
4. ~~메뉴 하단 장바구니 바~~ ✅ (`MenuCartStickyBar`) — 벤토 그리드 대신 **콤팩트 목록**은 배리어프리·스캔 밀도 우선  
5. ~~메뉴 상세 수량·요청(줄)·담기~~ ✅ · ~~옵션 그룹·더치페이~~ ✅ (`MenuItemOptionGroups`, `SplitBillPanel`) · 남음: InfoBanner CMS, PG/직원호출(의도적 보류)

---

## 관련 문서

- [ARCHITECTURE.md](./ARCHITECTURE.md)  
- [QR_AND_GUEST_ORDERS.md](./QR_AND_GUEST_ORDERS.md)
