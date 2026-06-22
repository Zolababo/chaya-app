-- 점주 분석 — DB 집계 (Node 2500건 스캔 대신)

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
      cancel_reason
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND created_at >= p_since
      AND created_at <= p_until
    ORDER BY created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 2500))
  ),
  totals AS (
    SELECT
      count(*)::int AS order_count,
      coalesce(sum(CASE WHEN status <> 'cancelled' THEN total_price ELSE 0 END), 0)::float8 AS total_sales,
      count(*) FILTER (WHERE status = 'completed')::int AS completed_count,
      count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count
    FROM base
  ),
  daily AS (
    SELECT
      to_char((created_at AT TIME ZONE 'Asia/Seoul')::date, 'YYYY-MM-DD') AS day_key,
      count(*)::int AS orders,
      coalesce(sum(CASE WHEN status <> 'cancelled' THEN total_price ELSE 0 END), 0)::float8 AS sales
    FROM base
    GROUP BY 1
    ORDER BY 1
  ),
  hourly AS (
    SELECT
      extract(hour FROM (created_at AT TIME ZONE 'Asia/Seoul'))::int AS hour,
      count(*)::int AS orders,
      coalesce(sum(CASE WHEN status <> 'cancelled' THEN total_price ELSE 0 END), 0)::float8 AS sales
    FROM base
    GROUP BY 1
    ORDER BY 1
  ),
  by_dow AS (
    SELECT
      extract(dow FROM (created_at AT TIME ZONE 'Asia/Seoul')::date)::int AS dow,
      count(*)::int AS orders,
      coalesce(sum(CASE WHEN status <> 'cancelled' THEN total_price ELSE 0 END), 0)::float8 AS sales
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
  '점주 분석 — 기간별 totals·daily·hourly·요일·취소사유 (service_role 호출)';
