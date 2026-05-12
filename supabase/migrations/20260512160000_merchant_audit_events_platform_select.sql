-- 플랫폼 운영자(`/ops`)가 모든 매장의 감사 로그를 조회할 수 있도록 SELECT 정책을 추가합니다.
-- (기존 멤버 정책과 OR 로 합쳐짐 — 운영자는 cross-tenant, 점주는 본인 매장만.)

CREATE POLICY "merchant_audit_events_select_platform_operator"
  ON public.merchant_audit_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.platform_operators po
      WHERE po.user_id = auth.uid()
    )
  );

COMMENT ON POLICY "merchant_audit_events_select_platform_operator" ON public.merchant_audit_events IS
  'Platform /ops UI: operators may read audit rows across tenants.';
