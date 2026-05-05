-- 주문 상세 JSON RPC 도 get_order_status_for_guest 와 동일한 세션 규칙을 씁니다.
-- guest_session_id 가 NULL 인 행은 기존처럼 id + tenant 만으로 조회됩니다.

DROP FUNCTION IF EXISTS public.get_order_for_guest(uuid, text);

CREATE OR REPLACE FUNCTION public.get_order_for_guest(
  p_order_id uuid,
  p_tenant_slug text,
  p_guest_session_id text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT to_jsonb(o)
  FROM public.orders o
  WHERE o.id = p_order_id
    AND lower(trim(o.tenant_slug)) = lower(trim(p_tenant_slug))
    AND (
      o.guest_session_id IS NULL
      OR (
        length(trim(coalesce(p_guest_session_id, ''))) BETWEEN 8 AND 128
        AND trim(o.guest_session_id) = trim(p_guest_session_id)
      )
    )
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_order_for_guest(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_for_guest(uuid, text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_order_for_guest(uuid, text, text) IS
  '손님 앱용 단건 주문 JSON. 주문에 guest_session_id 가 있으면 동일 값을 넘겨야 합니다.';
