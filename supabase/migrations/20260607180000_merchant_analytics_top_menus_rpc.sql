-- 점주 분석 — 인기 메뉴 (Node items JSON 스캔 대신)

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

COMMENT ON FUNCTION public.merchant_analytics_top_menus IS
  '점주 분석 — 기간별 인기 메뉴 id·수량 (service_role 호출)';
