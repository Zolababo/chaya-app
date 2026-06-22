-- 점주 홈 — 오늘·어제 KST 매출·주문 (2쿼리 → 1 RPC)

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
  WITH today AS (
    SELECT
      count(*)::int AS order_count,
      coalesce(sum(CASE WHEN status <> 'cancelled' THEN total_price ELSE 0 END), 0)::float8 AS total_sales,
      count(*) FILTER (WHERE status = 'cancelled')::int AS cancelled_count
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND created_at >= p_today_since
      AND created_at < p_today_until
  ),
  yesterday AS (
    SELECT
      count(*)::int AS order_count,
      coalesce(sum(CASE WHEN status <> 'cancelled' THEN total_price ELSE 0 END), 0)::float8 AS total_sales
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND created_at >= p_yesterday_since
      AND created_at < p_yesterday_until
  )
  SELECT jsonb_build_object(
    'today', (SELECT to_jsonb(t) FROM today t),
    'yesterday', (SELECT to_jsonb(y) FROM yesterday y)
  );
$$;

COMMENT ON FUNCTION public.merchant_today_kst_metrics IS
  '점주 홈 — KST 오늘·어제 주문·매출 집계 (service_role 호출)';
