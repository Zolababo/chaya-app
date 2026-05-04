-- 주문 행에 guest_session_id 가 있으면, 상태 전용 RPC 도 목록 RPC 와 같이 동일 세션 문자열을 요구합니다.
-- guest_session_id 가 NULL 인 행(레거시)은 기존처럼 order id + tenant 만으로 조회됩니다.

DROP FUNCTION IF EXISTS public.get_order_status_for_guest(uuid, text);

CREATE OR REPLACE FUNCTION public.get_order_status_for_guest(
  p_order_id uuid,
  p_tenant_slug text,
  p_guest_session_id text DEFAULT NULL
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.status::text
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

REVOKE ALL ON FUNCTION public.get_order_status_for_guest(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status_for_guest(uuid, text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_order_status_for_guest(uuid, text, text) IS
  '손님 앱용 주문 상태만 조회. 주문에 guest_session_id 가 있으면 동일 값을 넘겨야 합니다.';
