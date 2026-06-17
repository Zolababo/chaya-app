-- 플랫폼 운영자 공지 → 점주 알림 피드 (`/m/*/notifications`)

ALTER TABLE public.merchant_notification_events
  DROP CONSTRAINT IF EXISTS merchant_notification_events_kind_check;

ALTER TABLE public.merchant_notification_events
  ADD CONSTRAINT merchant_notification_events_kind_check
  CHECK (kind IN ('guest_order_created', 'order_status_changed', 'platform_announcement'));

COMMENT ON TABLE public.merchant_notification_events IS
  'Merchant alerts: order events + platform_announcement from /ops/settings. Written server-side with service role.';
