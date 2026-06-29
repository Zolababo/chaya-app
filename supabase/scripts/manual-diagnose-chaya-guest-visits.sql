-- =============================================================================
-- chaya — 오늘(KST) 결제완료 테스트 2건 vs 손님·재방문 집계 진단
-- Supabase Dashboard → SQL Editor → 블록별로 선택 후 Run
-- =============================================================================

-- 【A】 오늘 결제완료 주문 상세 (2건이 맞는지 먼저 확인)
WITH bounds AS (
  SELECT
    (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul') AS since_utc,
    ((date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') + interval '1 day') AT TIME ZONE 'Asia/Seoul') AS until_utc,
    to_char(date_trunc('day', now() AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM-DD') AS kst_today
)
SELECT
  b.kst_today,
  o.id,
  o.order_no,
  o.table_no,
  o.total_price,
  o.created_at,
  o.completed_at,
  (o.guest_session_id IS NOT NULL) AS has_guest_session,
  CASE
    WHEN o.guest_session_id IS NULL THEN NULL
    ELSE left(trim(o.guest_session_id), 8) || '…'
  END AS session_hint,
  -- 주문 탭「결제완료」: completed_at 오늘 OR (completed_at 없음 + created_at 오늘)
  (
    (o.completed_at >= b.since_utc AND o.completed_at < b.until_utc)
    OR (
      o.completed_at IS NULL
      AND o.created_at >= b.since_utc
      AND o.created_at < b.until_utc
    )
  ) AS counts_in_orders_paid_tab,
  -- 분석「손님·재방문」결제완료: guest_session 있음 + completed_at 오늘
  (
    o.guest_session_id IS NOT NULL
    AND length(trim(o.guest_session_id)) >= 8
    AND o.completed_at IS NOT NULL
    AND o.completed_at >= b.since_utc
    AND o.completed_at < b.until_utc
  ) AS counts_in_guest_insights
FROM bounds b
JOIN orders o ON o.tenant_slug = 'chaya' AND o.status = 'completed'
WHERE
  (o.completed_at >= b.since_utc AND o.completed_at < b.until_utc)
  OR (
    o.completed_at IS NULL
    AND o.created_at >= b.since_utc
    AND o.created_at < b.until_utc
  )
ORDER BY coalesce(o.completed_at, o.created_at) DESC;


-- 【B】 숫자만 한눈에 (주문 탭 2 vs 손님 1 원인)
WITH bounds AS (
  SELECT
    (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul') AS since_utc,
    ((date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') + interval '1 day') AT TIME ZONE 'Asia/Seoul') AS until_utc
)
SELECT
  (SELECT count(*)::int FROM orders o, bounds b
   WHERE o.tenant_slug = 'chaya' AND o.status = 'completed'
     AND (
       (o.completed_at >= b.since_utc AND o.completed_at < b.until_utc)
       OR (o.completed_at IS NULL AND o.created_at >= b.since_utc AND o.created_at < b.until_utc)
     )
  ) AS orders_paid_tab_today,
  (SELECT count(*)::int FROM orders o, bounds b
   WHERE o.tenant_slug = 'chaya' AND o.status = 'completed'
     AND o.guest_session_id IS NOT NULL
     AND length(trim(o.guest_session_id)) >= 8
     AND o.completed_at >= b.since_utc
     AND o.completed_at < b.until_utc
  ) AS guest_insights_completed_today,
  (SELECT count(*)::int FROM store_visits sv, bounds b
   WHERE sv.tenant_slug = 'chaya'
     AND sv.completed_at >= b.since_utc
     AND sv.completed_at < b.until_utc
  ) AS store_visits_today;


-- 【C】 store_visits 오늘 행
WITH bounds AS (
  SELECT
    (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul') AS since_utc,
    ((date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') + interval '1 day') AT TIME ZONE 'Asia/Seoul') AS until_utc
)
SELECT
  sv.order_id,
  sv.visit_number,
  left(sv.guest_session_id, 8) || '…' AS session_hint,
  sv.completed_at,
  sv.total_price
FROM store_visits sv, bounds b
WHERE sv.tenant_slug = 'chaya'
  AND sv.completed_at >= b.since_utc
  AND sv.completed_at < b.until_utc
ORDER BY sv.completed_at DESC;


-- 【D】 손님 집계 대상인데 store_visits 없음 (누락 후보)
WITH bounds AS (
  SELECT
    (date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') AT TIME ZONE 'Asia/Seoul') AS since_utc,
    ((date_trunc('day', now() AT TIME ZONE 'Asia/Seoul') + interval '1 day') AT TIME ZONE 'Asia/Seoul') AS until_utc
)
SELECT
  o.id AS order_id,
  o.completed_at,
  left(trim(o.guest_session_id), 8) || '…' AS session_hint
FROM orders o
CROSS JOIN bounds b
WHERE o.tenant_slug = 'chaya'
  AND o.status = 'completed'
  AND o.guest_session_id IS NOT NULL
  AND length(trim(o.guest_session_id)) >= 8
  AND o.completed_at >= b.since_utc
  AND o.completed_at < b.until_utc
  AND NOT EXISTS (SELECT 1 FROM store_visits sv WHERE sv.order_id = o.id);
