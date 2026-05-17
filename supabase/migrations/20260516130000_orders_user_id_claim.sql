-- C5: 로그인 사용자와 비회원 주문 claim.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_tenant_created
  ON public.orders (user_id, tenant_slug, created_at DESC)
  WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.orders.user_id IS '로그인 후 claim 으로 연결된 Supabase auth user.';

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

COMMENT ON FUNCTION public.claim_guest_orders_for_user(text, text) IS
  '현재 로그인 사용자에게 guest_session_id 가 일치하는 미연결 주문을 귀속.';

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
        'id', o.id,
        'total_price', o.total_price,
        'created_at', o.created_at,
        'status', o.status
      )
      ORDER BY o.created_at DESC
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

COMMENT ON FUNCTION public.list_orders_for_user(text, integer) IS
  '로그인 사용자 본인 주문 목록(해당 tenant).';
