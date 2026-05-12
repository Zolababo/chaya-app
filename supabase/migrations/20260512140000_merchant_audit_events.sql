-- 점주 콘솔에서 중요한 변경(주문 상태, 메뉴 CRUD 등)을 추적합니다.
-- INSERT 는 서버(Server Action)에서 service role 로만 수행합니다.
-- SELECT 는 해당 매장의 승인된 멤버만 (향후 UI·감사 조회용).

CREATE TABLE public.merchant_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  tenant_slug text NOT NULL,
  actor_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  action text NOT NULL CHECK (char_length(action) <= 120),
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX merchant_audit_events_tenant_created_idx
  ON public.merchant_audit_events (tenant_slug, created_at DESC);

COMMENT ON TABLE public.merchant_audit_events IS
  'Merchant console audit trail; written server-side with service role.';

ALTER TABLE public.merchant_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_audit_events_select_member"
  ON public.merchant_audit_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.merchant_tenant_members m
      WHERE m.user_id = auth.uid()
        AND m.tenant_slug = merchant_audit_events.tenant_slug
        AND m.approved_at IS NOT NULL
    )
  );
