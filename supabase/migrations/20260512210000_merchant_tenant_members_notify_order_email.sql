-- 점주 멤버별: 신규 주문 Resend 알림 수신 여부(기본 true). 다음 단계에서 /ops UI 로 토글 예정.

ALTER TABLE public.merchant_tenant_members
ADD COLUMN IF NOT EXISTS notify_order_email boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.merchant_tenant_members.notify_order_email IS
  'When true (default), include invite_email in guest-order Resend recipient list if set.';
