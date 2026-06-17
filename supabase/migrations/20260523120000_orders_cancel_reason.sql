-- 점주 취소 사유 (취소 탭·분석용). 앱에서 허용 코드만 저장합니다.

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancel_reason text;

COMMENT ON COLUMN public.orders.cancel_reason IS
  '점주 취소 시 사유 코드(guest_change, sold_out, duplicate, staff_error, table_move, app_error, other). status=cancelled 일 때만.';
