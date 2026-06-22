-- 점주앱 Realtime — 승인된 멤버만 자기 매장 orders 변경 수신

DROP POLICY IF EXISTS orders_merchant_member_select ON public.orders;

CREATE POLICY orders_merchant_member_select
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.merchant_tenant_members m
      WHERE m.tenant_slug = orders.tenant_slug
        AND m.user_id = auth.uid()
        AND m.approved_at IS NOT NULL
    )
  );

COMMENT ON POLICY orders_merchant_member_select ON public.orders IS
  '승인된 점주·직원 — 자기 tenant 주문 Realtime·SELECT (민감 필드는 앱에서만 사용)';

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
