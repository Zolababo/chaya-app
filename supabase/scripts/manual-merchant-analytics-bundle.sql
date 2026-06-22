-- Supabase SQL Editor용 — 순서대로 한 번에 실행
-- bundle(20260619140000)은 top_menus(20260607180000)·core(20260607140000)가 있어야 합니다.
-- core는 이미 있을 수 있음. top_menus 없으면 bundle이 42883으로 실패합니다.

-- 1) 인기 메뉴 RPC (없으면 생성)
CREATE OR REPLACE FUNCTION public.merchant_analytics_top_menus(
  p_tenant_slug text,
  p_since timestamptz,
  p_until timestamptz,
  p_order_limit int DEFAULT 600,
  p_top_n int DEFAULT 12
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH recent AS (
    SELECT items
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND created_at >= p_since
      AND created_at <= p_until
      AND status <> 'cancelled'
    ORDER BY created_at DESC
    LIMIT GREATEST(1, LEAST(p_order_limit, 600))
  ),
  lines AS (
    SELECT
      nullif(trim(elem->>'id'), '') AS menu_id,
      GREATEST(
        1,
        LEAST(
          99,
          coalesce(
            (CASE
              WHEN jsonb_typeof(elem->'quantity') = 'number' THEN (elem->>'quantity')::int
              WHEN jsonb_typeof(elem->'quantity') = 'string' THEN (elem->>'quantity')::int
              ELSE 1
            END),
            1
          )
        )
      ) AS qty
    FROM recent r
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(r.items) = 'array' THEN r.items ELSE '[]'::jsonb END
    ) AS elem
  ),
  agg AS (
    SELECT menu_id, sum(qty)::int AS qty
    FROM lines
    WHERE menu_id IS NOT NULL
    GROUP BY menu_id
    ORDER BY qty DESC, menu_id
    LIMIT GREATEST(1, LEAST(p_top_n, 12))
  )
  SELECT coalesce(
    (
      SELECT jsonb_agg(
        jsonb_build_object('menu_id', menu_id, 'qty', qty)
        ORDER BY qty DESC, menu_id
      )
      FROM agg
    ),
    '[]'::jsonb
  );
$$;

-- 2) bundle RPC
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

COMMENT ON FUNCTION public.merchant_analytics_top_menus IS
  '점주 분석 — 기간별 인기 메뉴 id·수량 (service_role 호출)';

COMMENT ON FUNCTION public.merchant_analytics_bundle IS
  '점주 분석 — 기간·전기간·인기메뉴 bundle (service_role, 왕복 1회)';
