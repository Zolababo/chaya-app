-- 손님 주문 상세의 상태 배지만 갱신할 때: 전행 JSON 대신 status 텍스트만 반환합니다.

CREATE OR REPLACE FUNCTION public.get_order_status_for_guest(p_order_id uuid, p_tenant_slug text)
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
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_order_status_for_guest(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_status_for_guest(uuid, text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_order_status_for_guest(uuid, text) IS
  '손님 앱용 주문 상태만 조회. get_order_for_guest 보다 페이로드가 작습니다.';
