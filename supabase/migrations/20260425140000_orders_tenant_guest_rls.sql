-- 레거시 `orders` 테이블(consumer/admin HTML) 전제입니다. 테이블이 없으면 이 마이그레이션은 실패합니다.
-- RLS 적용 후: anon 은 INSERT 만 가능합니다. 주문 목록·삭제는 service_role(또는 향후 점주 인증)으로만 하세요.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tenant_slug text;

UPDATE public.orders
SET tenant_slug = 'demo'
WHERE tenant_slug IS NULL OR trim(tenant_slug) = '';

ALTER TABLE public.orders
  ALTER COLUMN tenant_slug SET DEFAULT 'demo';

ALTER TABLE public.orders
  ALTER COLUMN tenant_slug SET NOT NULL;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_session_id text;

CREATE INDEX IF NOT EXISTS idx_orders_tenant_created
  ON public.orders (tenant_slug, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_guest_session
  ON public.orders (guest_session_id)
  WHERE guest_session_id IS NOT NULL;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS orders_guest_insert ON public.orders;

CREATE POLICY orders_guest_insert
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    tenant_slug IS NOT NULL
    AND length(trim(tenant_slug)) > 0
    AND total_price IS NOT NULL
    AND total_price >= 0
    AND total_price <= 100000000
    AND items IS NOT NULL
    AND jsonb_typeof(items::jsonb) = 'array'
    AND jsonb_array_length(items::jsonb) > 0
    AND jsonb_array_length(items::jsonb) <= 200
  );

COMMENT ON COLUMN public.orders.tenant_slug IS '메뉴 앱 경로 /t/{slug} 와 동일. 주문이 어느 가게 것인지 구분.';
COMMENT ON COLUMN public.orders.guest_session_id IS '비회원 세션(브라우저). 가입 후 claim 등에 사용 가능.';
COMMENT ON POLICY orders_guest_insert ON public.orders IS
  '손님 앱 anon INSERT. SELECT/UPDATE/DELETE 는 정책 없음 → anon 불가(service_role 사용).';
