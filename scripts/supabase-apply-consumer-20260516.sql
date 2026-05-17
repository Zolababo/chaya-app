-- Supabase SQL Editor 에 붙여 넣어 한 번 실행 (options_json + C5 claim).
-- 또는 권한 있는 환경에서: supabase db push

-- 20260516120000_chaya_menus_options_json.sql
ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS options_json jsonb;

COMMENT ON COLUMN public."ChayaMenus".options_json IS
  '옵션 그룹 배열 JSON. 예: [{"id":"spice","name":"맵기","required":true,"choices":[{"id":"mild","label":"순한맛"},{"id":"hot","label":"매운맛","priceDelta":0}]}]';

-- 20260516130000_orders_user_id_claim.sql (+ 20260516130100 fix)
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_tenant_created
  ON public.orders (user_id, tenant_slug, created_at DESC)
  WHERE user_id IS NOT NULL;

DROP POLICY IF EXISTS orders_authenticated_select_own ON public.orders;

CREATE POLICY orders_authenticated_select_own
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP FUNCTION IF EXISTS public.claim_guest_orders_for_user(text, text);

CREATE OR REPLACE FUNCTION public.claim_guest_orders_for_user(
  p_tenant_slug text,
  p_guest_session_id text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
  uid uuid;
BEGIN
  uid := auth.uid();
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;
  IF length(trim(coalesce(p_tenant_slug, ''))) = 0 THEN
    RETURN 0;
  END IF;
  IF length(trim(coalesce(p_guest_session_id, ''))) NOT BETWEEN 8 AND 128 THEN
    RETURN 0;
  END IF;
  UPDATE public.orders o
  SET user_id = uid
  WHERE o.user_id IS NULL
    AND o.guest_session_id IS NOT NULL
    AND trim(o.guest_session_id) = trim(p_guest_session_id)
    AND lower(trim(o.tenant_slug)) = lower(trim(p_tenant_slug));
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_guest_orders_for_user(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_guest_orders_for_user(text, text) TO authenticated;

DROP FUNCTION IF EXISTS public.list_orders_for_user(text, integer);

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

REVOKE ALL ON FUNCTION public.list_orders_for_user(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_orders_for_user(text, integer) TO authenticated;
