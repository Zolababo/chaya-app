-- Fix alias in list_orders_for_user (sub.id not o.id).

CREATE OR REPLACE FUNCTION public.list_orders_for_user(
  p_tenant_slug text,
  p_limit integer DEFAULT 30
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', sub.id,
        'total_price', sub.total_price,
        'created_at', sub.created_at,
        'status', sub.status
      )
      ORDER BY sub.created_at DESC
    ),
    '[]'::jsonb
  )
  FROM (
    SELECT o.id, o.total_price, o.created_at, o.status
    FROM public.orders o
    WHERE o.user_id = auth.uid()
      AND lower(trim(o.tenant_slug)) = lower(trim(p_tenant_slug))
    ORDER BY o.created_at DESC
    LIMIT greatest(1, least(coalesce(p_limit, 30), 50))
  ) sub;
$$;
