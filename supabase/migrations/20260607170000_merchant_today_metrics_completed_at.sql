-- 점주 홈 매출 — completed_at(KST) 기준 (ops todayPaid와 정합)

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
      count(*) FILTER (
        WHERE created_at >= p_today_since AND created_at < p_today_until
      )::int AS order_count,
      count(*) FILTER (
        WHERE status = 'cancelled'
          AND created_at >= p_today_since AND created_at < p_today_until
      )::int AS cancelled_count,
      coalesce(
        sum(total_price) FILTER (
          WHERE status = 'completed'
            AND completed_at IS NOT NULL
            AND completed_at >= p_today_since AND completed_at < p_today_until
        ),
        0
      )::float8 AS total_sales
    FROM orders
    WHERE tenant_slug = p_tenant_slug
  ),
  yesterday AS (
    SELECT
      count(*) FILTER (
        WHERE status = 'completed'
          AND completed_at IS NOT NULL
          AND completed_at >= p_yesterday_since AND completed_at < p_yesterday_until
      )::int AS order_count,
      coalesce(
        sum(total_price) FILTER (
          WHERE status = 'completed'
            AND completed_at IS NOT NULL
            AND completed_at >= p_yesterday_since AND completed_at < p_yesterday_until
        ),
        0
      )::float8 AS total_sales
    FROM orders
    WHERE tenant_slug = p_tenant_slug
  )
  SELECT jsonb_build_object(
    'today', (SELECT to_jsonb(t) FROM today t),
    'yesterday', (SELECT to_jsonb(y) FROM yesterday y)
  );
$$;

COMMENT ON FUNCTION public.merchant_today_kst_metrics IS
  '점주 홈 — KST 오늘 주문·취소(created_at), 매출·어제 비교(completed_at)';
