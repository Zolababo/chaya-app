# 점주앱(`/m/*`) 성능 — 2026-06

## 원인 (느려 보이던 이유)

1. **`router.refresh()` 폭주** — 레이아웃 + 홈 + 주문 + 메뉴·테이블 등 여러 화면에 `OrderStatusRefresh`가 붙어 **15~22초마다 전체 SSR·DB를 재실행**.
2. **탭 이동 시에도 동일** — 메뉴·분석 화면에서도 백그라운드 refresh가 돌아 체감 지연.
3. **중복 DB 조회** — `countMerchantPendingOrders` + `getMerchantHomeOpsCounts`가 같은 요청에서 pending을 두 번 count.
4. **페이지마다 중복 chrome SSR** — 헤더·서브 nav·preview 배너가 layout과 각 page에서 **두 번** 렌더·쿼리.
5. **Link prefetch** — 하단 탭이 무거운 RSC 페이지를 미리 fetch.

## 적용한 최적화

| 변경 | 효과 |
|------|------|
| `MerchantLiveSync` + `GET /m/{tenant}/live/summary` | 뱃지·알림은 **가벼운 JSON**만 폴링 (`getMerchantPendingCountQuick`, pending 1쿼리) |
| `router.refresh()` **홈·주문 화면에서만** | 메뉴/분석/설정 이동 시 **전체 새로고침 없음** |
| 레이아웃·하위 페이지 **OrderStatusRefresh 제거** | 폴링 **1곳**으로 통합 |
| **공통 shell을 layout으로 이동** | `MerchantHomeHeader` · `MerchantSubnav` · `MerchantPreviewBanner` **1회만** SSR |
| **`countMerchantPendingOrders` 페이지 제거** | pending은 live context + 주문/홈 ops 쿼리만 |
| `loading.tsx` (탭 전환 skeleton) | 체감 대기 완화 |
| 주문 툴바 refresh | **수동 버튼만** (`autoRefresh={false}`) |
| `cache()` on pending/ops counts | 요청당 DB 중복 제거 |
| `listMenusForMerchant` → `CHAYA_MENU_SELECT_MERCH` | 목록 payload 축소 (options/translations 제외) |
| `MerchantBottomNav` `prefetch={false}` + **의도 prefetch** | 4탭 상시 prefetch 없음, 터치 직전만 warm |
| `MerchantPendingCountProvider` | 하단·서브 nav 뱃지 클라이언트 갱신 |
| **`MerchantMainTabShell` (4탭 SPA)** | 홈·주문·메뉴·분석 패널 **layout에서 1회 마운트**, 탭 전환 시 **숨김만** (RSC·언마운트 없음) |
| **`GET /live/analytics` + 클라이언트 캐시** | 분석 탭 SSR·2,500건 집계 생략, 차트 lazy load |
| **45s stale cache** | 탭 왕복·재진입 시 불필요한 JSON 재조회 생략 |
| **LiveSync: pending 변경 시만** 무효화 | 22초마다 홈·주문 전체 refetch 제거 |
| **홈 메뉴 `CHAYA_MENU_SELECT_HOME`** | description·이미지·옵션 제외 경량 조회 |
| 홈·주문 화면 폴링 | `router.refresh()` **제거** → 해당 scope 캐시 무효화만 |

## 유지

- 홈·주문: ~22초마다 또는 pending 변경 시 **live JSON 재조회** (캐시 무효화).
- 새 주문: `MerchantNewOrderAlertListener` + 띵똥 (변경 없음).

## 웹앱 vs 네이티브 (네이버 등)

| | CHAYA 점주 웹앱 | 네이티브 앱 |
|--|----------------|------------|
| 화면 전환 | 탭마다 **서버 RSC 왕복** (인증 + 레이아웃 + 페이지) | UI는 **메모리에 유지**, 데이터만 백그라운드 |
| 첫 탭 이후 | `staleTimes` + 클라이언트 JSON 캐시로 완화 | 디스크·메모리 캐시 즉시 |
| 데이터 | Supabase 원격 쿼리 | 로컬 우선 + 동기화 |
| 오프라인 | 제한적 (PWA 미적용) | 오프라인 UI 가능 |

**솔직한 한계:** `force-dynamic` SSR 웹앱은 네이티브만큼 “빠릿”해지기 **구조적으로 어렵습니다**. JSON 캐시·폴링 최적화로 **데이터**는 가벼워졌지만, **탭 클릭 → 서버 응답 → 화면 그리기** 구간(수백 ms~)은 웹 아키텍처 비용입니다.

**체감을 네이티브에 가깝게 하려면 (로드맵):**
1. ~~staleTimes~~ **(적용됨)** — 30초 내 같은 탭 재진입 시 RSC 재요청 생략
2. ~~**4탭 단일 SPA 셸**~~ **(적용됨)** — `MerchantMainTabShell`: layout에서 4패널 유지, 탭은 URL만 변경
3. **PWA** — chrome·아이콘 즉시, 오프라인 shell
4. **장기: 점주 네이티브 앱** (Play/App Store 분리 예정) — 진짜 네이티브 UX

**다음 단계(체감 큰 순):**
1. 하단 탭 **의도 prefetch** — 터치 직전에만 `router.prefetch` (적용됨)
2. 메뉴·주문·**홈** 목록 **클라이언트 캐시** — 탭 왕복 시 SSR 생략 **(적용됨)**
3. **PWA shell** — 정적 chrome 즉시 표시
4. 분석 탭 live JSON + 캐시 (기간 집계) **(적용됨)**
5. 장기: 점주 **네이티브 앱** (로드맵상 분리 예정)

## 이후 (선택)

- 홈 메뉴 카드: summary-only select (건수·품절만).
- 주문 목록: RSC refresh 대신 부분 API + client patch.
- PWA + service worker 캐시 (정적 shell).
