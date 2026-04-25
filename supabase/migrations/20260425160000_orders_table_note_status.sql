-- 테이블 번호·손님 요청 메모·주문 상태(주방/홀용). 기존 행은 기본값으로 채워집니다.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_no text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS guest_note text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS status text;

UPDATE public.orders
SET status = 'pending'
WHERE status IS NULL
   OR trim(status) = ''
   OR lower(trim(status)) NOT IN (
        'pending',
        'accepted',
        'preparing',
        'ready',
        'completed',
        'cancelled'
      );

ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.orders
  ALTER COLUMN status SET NOT NULL;

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_allowed;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_allowed
  CHECK (
    status IN ('pending', 'accepted', 'preparing', 'ready', 'completed', 'cancelled')
  );

COMMENT ON COLUMN public.orders.table_no IS '테이블·좌석 번호(선택). QR 입장 시 입력.';
COMMENT ON COLUMN public.orders.guest_note IS '주문 전체에 대한 손님 요청(선택).';
COMMENT ON COLUMN public.orders.status IS '주방·홀 처리 상태. 손님 INSERT 는 pending 만 허용(RLS).';

-- anon INSERT: status 조작 방지·문자 길이 제한
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
    AND status = 'pending'
    AND (table_no IS NULL OR length(trim(table_no)) <= 30)
    AND (guest_note IS NULL OR length(trim(guest_note)) <= 500)
  );

COMMENT ON POLICY orders_guest_insert ON public.orders IS
  '손님 앱 anon INSERT. status 는 pending 만. table_no / guest_note 길이 제한.';
