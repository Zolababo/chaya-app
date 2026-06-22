# Supabase 마이그레이션 — 수동 적용 체크리스트

> **Vercel 배포만으로 DB는 바뀌지 않습니다.** 아래 SQL을 Supabase Dashboard → **SQL Editor**에서 **순서대로** 실행하거나, 로컬에서 `supabase db push` / `supabase migration up`으로 적용하세요.

## 2026-06 성능·손님 데이터 (미적용 시 앱은 fallback 동작)

| 순서 | 파일 | 내용 | 미적용 시 |
|------|------|------|-----------|
| 1 | `20260606120000_merchant_guest_visits.sql` | `completed_at`, `store_visits`, `tenant_guest_rollups` | 손님 방문·재방문 집계·오늘 결제완료 `completed_at` 기준 불가 |
| 2 | `20260607120000_merchant_orders_perf_indexes.sql` | `(tenant_slug, status, created_at/completed_at)` 인덱스 | 주문·결제완료 탭·집계 쿼리 느림 |
| 3 | `20260607140000_merchant_analytics_rpc.sql` | `merchant_analytics_core()` | 분석 탭 Node 2,500건 스캔 fallback |
| 4 | `20260607150000_merchant_orders_realtime_rls.sql` | 점주 `orders` SELECT RLS + Realtime publication | Realtime 주문 푸시 불가, 90초 폴링만 |
| 5 | `20260607160000_merchant_today_metrics_rpc.sql` | `merchant_today_kst_metrics()` (초版) | 홈 오늘 매출 2쿼리 행 스캔 fallback |
| 6 | `20260607170000_merchant_today_metrics_completed_at.sql` | 매출·어제 비교 `completed_at` 기준 | 홈 매출 vs ops 결제완료 숫자 어긋남 |
| 7 | `20260607180000_merchant_analytics_top_menus_rpc.sql` | `merchant_analytics_top_menus()` | 분석 인기 메뉴 Node items 스캔 fallback |

## 적용 방법 (Dashboard)

1. Supabase 프로젝트 → **SQL Editor** → New query
2. 위 표 **1번 파일 전체**를 복사·붙여넣기 → Run
3. 오류 없으면 2번 → … → 7번 반복
4. (4번 적용 후) **Database → Replication**에서 `orders`가 publication에 포함됐는지 확인

> **6·7번**은 5·3번 이후 **REPLACE** 형태입니다. 이미 5·3번을 적용했다면 6·7번만 추가 실행하면 됩니다.

## 적용 확인 (선택)

```sql
SELECT proname FROM pg_proc
WHERE proname IN (
  'merchant_analytics_core',
  'merchant_analytics_top_menus',
  'merchant_today_kst_metrics'
);

SELECT * FROM pg_publication_tables
WHERE pubname = 'supabase_realtime' AND tablename = 'orders';
```

## 관련 문서

- 점주 성능 로드맵: `docs/MERCHANT_PERFORMANCE.md`
