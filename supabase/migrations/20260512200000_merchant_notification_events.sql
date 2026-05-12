-- 점주/플랫폼용 in-app 알림 피드 + (선택) 이메일 발송 기록.
-- INSERT/UPDATE 는 서버 service role 전용. SELECT 는 승인 멤버(해당 매장) 또는 platform_operators.

CREATE TABLE public.merchant_notification_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_slug text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('guest_order_created', 'order_status_changed')),
  order_id uuid REFERENCES public.orders (id) ON DELETE SET NULL,
  summary text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_status text NOT NULL DEFAULT 'skipped' CHECK (email_status IN ('skipped', 'sent', 'failed')),
  email_detail text NULL
);

CREATE INDEX merchant_notification_events_tenant_created_idx
  ON public.merchant_notification_events (tenant_slug, created_at DESC);

COMMENT ON TABLE public.merchant_notification_events IS
  'Merchant alerts (Phase 3): in-app feed; optional Resend email. Written server-side with service role.';

ALTER TABLE public.merchant_notification_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_notification_events_select_member"
  ON public.merchant_notification_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.merchant_tenant_members m
      WHERE m.user_id = auth.uid()
        AND m.tenant_slug = merchant_notification_events.tenant_slug
        AND m.approved_at IS NOT NULL
    )
  );

CREATE POLICY "merchant_notification_events_select_platform_operator"
  ON public.merchant_notification_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.platform_operators po
      WHERE po.user_id = auth.uid()
    )
  );
