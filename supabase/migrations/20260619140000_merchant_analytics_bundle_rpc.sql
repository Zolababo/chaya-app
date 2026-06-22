-- 점주 분석 — current + previous + top_menus 단일 RPC (HTTP 왕복 1회)
-- 선행: merchant_analytics_core (20260607140000), merchant_analytics_top_menus (20260607180000)
-- SQL Editor에서 bundle만 실행하면 42883 — scripts/manual-merchant-analytics-bundle.sql 사용

CREATE OR REPLACE FUNCTION public.merchant_analytics_bundle(
  p_tenant_slug text,
  p_since timestamptz,
  p_until timestamptz,
  p_prev_since timestamptz,
  p_prev_until timestamptz,
  p_core_limit int DEFAULT 2500,
  p_top_order_limit int DEFAULT 600,
  p_top_n int DEFAULT 12
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'current',
    public.merchant_analytics_core(
      p_tenant_slug,
      p_since,
      p_until,
      GREATEST(1, LEAST(p_core_limit, 2500))
    ),
    'previous',
    public.merchant_analytics_core(
      p_tenant_slug,
      p_prev_since,
      p_prev_until,
      GREATEST(1, LEAST(p_core_limit, 2500))
    ),
    'top_menus',
    public.merchant_analytics_top_menus(
      p_tenant_slug,
      p_since,
      p_until,
      GREATEST(1, LEAST(p_top_order_limit, 600)),
      GREATEST(1, LEAST(p_top_n, 12))
    )
  );
$$;

COMMENT ON FUNCTION public.merchant_analytics_bundle IS
  '점주 분석 — 기간·전기간·인기메뉴 bundle (service_role, 왕복 1회)';
