-- anon 은 orders SELECT 불가이므로, id + tenant_slug 가 일치할 때만 한 행을 JSON 으로 돌려줍니다.
-- URL 을 아는 사람만 조회 가능(비밀 아님). 무차별 id 대입은 UUID v4 가정으로 어렵습니다.

CREATE OR REPLACE FUNCTION public.get_order_for_guest(p_order_id uuid, p_tenant_slug text)
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
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_order_for_guest(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_order_for_guest(uuid, text) TO anon, authenticated;

COMMENT ON FUNCTION public.get_order_for_guest(uuid, text) IS
  '손님 앱용 단건 주문 조회. RLS 를 우회하므로 WHERE 를 id+tenant_slug 로만 제한합니다.';
