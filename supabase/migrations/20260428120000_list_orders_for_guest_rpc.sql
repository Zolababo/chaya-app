-- anon 은 orders SELECT 불가. tenant_slug + guest_session_id 가 일치하는 행만 최근순으로 JSON 배열로 반환합니다.
-- guest_session_id 는 브라우저에만 두는 값이므로 URL에 노출되지 않게 앱에서 관리합니다.

CREATE OR REPLACE FUNCTION public.list_orders_for_guest(
  p_tenant_slug text,
  p_guest_session_id text,
  p_limit integer DEFAULT 20
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH filtered AS (
    SELECT to_jsonb(o) AS j, o.created_at AS ts
    FROM public.orders o
    WHERE length(trim(coalesce(p_tenant_slug, ''))) > 0
      AND length(trim(coalesce(p_guest_session_id, ''))) BETWEEN 8 AND 128
      AND lower(trim(o.tenant_slug)) = lower(trim(p_tenant_slug))
      AND o.guest_session_id IS NOT NULL
      AND trim(o.guest_session_id) = trim(p_guest_session_id)
    ORDER BY o.created_at DESC
    LIMIT greatest(1, least(coalesce(nullif(p_limit, 0), 20), 50))
  )
  SELECT coalesce(
    (SELECT jsonb_agg(j ORDER BY ts DESC) FROM filtered),
    '[]'::jsonb
  );
$$;

REVOKE ALL ON FUNCTION public.list_orders_for_guest(text, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_orders_for_guest(text, text, integer) TO anon, authenticated;

COMMENT ON FUNCTION public.list_orders_for_guest(text, text, integer) IS
  '손님 앱용 최근 주문 목록. RLS 우회이므로 tenant_slug+guest_session_id+LIMIT 만 허용합니다.';
