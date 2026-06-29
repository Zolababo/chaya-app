-- 점주 분석 — 결제 이벤트 건수(테이블 세션 1회) + 매출은 status=completed 만

CREATE OR REPLACE FUNCTION public.merchant_analytics_core(
  p_tenant_slug text,
  p_since timestamptz,
  p_until timestamptz,
  p_limit int DEFAULT 2500
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH base AS (
    SELECT
      created_at,
      total_price,
      status,
      cancel_reason,
      table_session_id,
      completed_at
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND created_at >= p_since
      AND created_at <= p_until
    ORDER BY created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 2500))
  ),
  payment_orders AS (
    SELECT
      total_price,
      table_session_id
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND status = 'completed'
      AND (
        (completed_at IS NOT NULL AND completed_at >= p_since AND completed_at <= p_until)
        OR (
          completed_at IS NULL
          AND created_at >= p_since
          AND created_at <= p_until
        )
      )
  ),
  totals AS (
    SELECT
      count(*)::int AS order_count,
      coalesce((SELECT sum(total_price) FROM payment_orders), 0)::float8 AS total_sales,
      (
        COALESCE((
          SELECT count(*)::int
          FROM (
            SELECT DISTINCT table_session_id
            FROM payment_orders
            WHERE table_session_id IS NOT NULL
          ) paid_sessions
        ), 0)
        + COALESCE((
          SELECT count(*)::int
          FROM payment_orders
          WHERE table_session_id IS NULL
        ), 0)
      )::int AS completed_count,
      count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count
    FROM base
  ),
  daily AS (
    SELECT
      to_char((created_at AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD') AS day_key,
      count(*)::int AS orders,
      coalesce(
        sum(total_price) FILTER (WHERE status = 'completed'),
        0
      )::float8 AS sales
    FROM base
    GROUP BY 1
    ORDER BY 1
  ),
  hourly AS (
    SELECT
      extract(hour FROM (created_at AT TIME ZONE 'Asia/Seoul'))::int AS hour,
      count(*)::int AS orders,
      coalesce(
        sum(total_price) FILTER (WHERE status = 'completed'),
        0
      )::float8 AS sales
    FROM base
    GROUP BY 1
    ORDER BY 1
  ),
  by_dow AS (
    SELECT
      extract(dow FROM (created_at AT TIME ZONE 'Asia/Seoul')::date)::int AS dow,
      count(*)::int AS orders,
      coalesce(
        sum(total_price) FILTER (WHERE status = 'completed'),
        0
      )::float8 AS sales
    FROM base
    GROUP BY 1
    ORDER BY 1
  ),
  cancel_reasons AS (
    SELECT
      coalesce(nullif(trim(cancel_reason), ''), 'other') AS reason,
      count(*)::int AS cnt
    FROM base
    WHERE status = 'cancelled'
    GROUP BY 1
    ORDER BY 2 DESC
  )
  SELECT jsonb_build_object(
    'totals', (SELECT to_jsonb(t) FROM totals t),
    'daily', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.day_key) FROM daily d), '[]'::jsonb),
    'hourly', coalesce((SELECT jsonb_agg(to_jsonb(h) ORDER BY h.hour) FROM hourly h), '[]'::jsonb),
    'by_dow', coalesce((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.dow) FROM by_dow w), '[]'::jsonb),
    'cancel_reasons', coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM cancel_reasons c), '[]'::jsonb)
  );
$$;

COMMENT ON FUNCTION public.merchant_analytics_core IS
  '점주 분석 — 주문(created_at)·매출·결제건수(completed_at, 세션당 1)·취소';
