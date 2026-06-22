# 점주앱(`/m/*`) 성능 — 2026-06

## P0~P2 (2026-06-07)

탭 SPA·live JSON·Realtime·소비자 lazy image·RPC — `docs/SUPABASE_MIGRATIONS_CHECKLIST.md` 참고.

## P3 — 적용됨 (2026-06)

| 변경 | 효과 |
|------|------|
| `/live/dashboard` **ops 포함 단일 API** | 홈 네트워크 2회 → 1회 |
| `useMerchantDashboardLive` + ops 캐시 mirror | 주문 탭 ops 캐시 warm |
| `merchant_analytics_top_menus()` RPC | 분석 인기 메뉴 DB 집계 |
| `merchant_today_kst_metrics` **completed_at** | 홈 매출 ↔ ops 결제완료 정합 |
| 하단 탭 intent **`/live/*` warm** | 첫 탭 진입 JSON 선로드 |
| `/live/summary` + context **Realtime 진단** | `realtimeConfigured`·`realtimeSubscribed` |

## P3 — 콜드 스타트 (2026-06, 바로가기)

| 변경 | 효과 |
|------|------|
| Layout **Suspense 스트리밍** | 헤더·하단 nav 먼저 paint, 인증은 뒤 |
| layout **settings SSR 제거** | DB 1회 줄임 → dashboard/branding |
| **sessionStorage** dashboard·ops | 재진입 시 **직전 데이터 즉시** |
| 홈 **카드형 skeleton** | 전체 화면 스피너 대신 |
| dashboard **static import** | 첫 탭 JS chunk 1회 제거 |
| SW **`/_next/static` 캐시** | 2번째 열기부터 JS 즉시 |
| `/m/manifest.webmanifest` standalone | 바로가기 점주 전용 |

**한계:** 첫 설치·첫 방문은 여전히 네트워크+SSR. 네이버/토ss급은 **네이티브 앱** 또는 데이터 축적 후 SW shell.

## Supabase 수동 적용

**`docs/SUPABASE_MIGRATIONS_CHECKLIST.md`** — 7개 migration (6·7번은 추가 적용).

## 이후 (선택)

- PWA shell
- 일별 rollup 테이블
- 점주 네이티브 앱
