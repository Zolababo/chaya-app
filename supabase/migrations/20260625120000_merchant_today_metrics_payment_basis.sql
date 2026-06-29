-- 점주 홈 매출 — 분석탭과 동일: 결제완료(completed_at)·세션당 1건. 주문 수는 접수(created_at) 유지.

CREATE OR REPLACE FUNCTION public.merchant_today_kst_metrics(
  p_tenant_slug text,
  p_today_since timestamptz,
  p_today_until timestamptz,
  p_yesterday_since timestamptz,
  p_yesterday_until timestamptz
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH today_orders AS (
    SELECT status
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND created_at >= p_today_since
      AND created_at < p_today_until
  ),
  today_payment AS (
    SELECT total_price, table_session_id
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND status = 'completed'
      AND (
        (
          completed_at IS NOT NULL
          AND completed_at >= p_today_since
          AND completed_at < p_today_until
        )
        OR (
          completed_at IS NULL
          AND created_at >= p_today_since
          AND created_at < p_today_until
        )
      )
  ),
  today AS (
    SELECT
      (SELECT count(*)::int FROM today_orders) AS order_count,
      (
        SELECT count(*) FILTER (WHERE status = 'cancelled')::int
        FROM today_orders
      ) AS cancelled_count,
      coalesce((SELECT sum(total_price) FROM today_payment), 0)::float8 AS total_sales,
      (
        COALESCE((
          SELECT count(*)::int
          FROM (
            SELECT DISTINCT table_session_id
            FROM today_payment
            WHERE table_session_id IS NOT NULL
          ) paid_sessions
        ), 0)
        + COALESCE((
          SELECT count(*)::int
          FROM today_payment
          WHERE table_session_id IS NULL
        ), 0)
      )::int AS completed_count
  ),
  yesterday_orders AS (
    SELECT status
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND created_at >= p_yesterday_since
      AND created_at < p_yesterday_until
  ),
  yesterday_payment AS (
    SELECT total_price, table_session_id
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND status = 'completed'
      AND (
        (
          completed_at IS NOT NULL
          AND completed_at >= p_yesterday_since
          AND completed_at < p_yesterday_until
        )
        OR (
          completed_at IS NULL
          AND created_at >= p_yesterday_since
          AND created_at < p_yesterday_until
        )
      )
  ),
  yesterday AS (
    SELECT
      (SELECT count(*)::int FROM yesterday_orders) AS order_count,
      coalesce((SELECT sum(total_price) FROM yesterday_payment), 0)::float8 AS total_sales,
      (
        COALESCE((
          SELECT count(*)::int
          FROM (
            SELECT DISTINCT table_session_id
            FROM yesterday_payment
            WHERE table_session_id IS NOT NULL
          ) paid_sessions
        ), 0)
        + COALESCE((
          SELECT count(*)::int
          FROM yesterday_payment
          WHERE table_session_id IS NULL
        ), 0)
      )::int AS completed_count
  )
  SELECT jsonb_build_object(
    'today', (SELECT to_jsonb(t) FROM today t),
    'yesterday', (SELECT to_jsonb(y) FROM yesterday y)
  );
$$;

COMMENT ON FUNCTION public.merchant_today_kst_metrics IS
  '점주 홈 — 주문·취소(created_at), 매출·결제건수(completed_at, 세션당 1)';
