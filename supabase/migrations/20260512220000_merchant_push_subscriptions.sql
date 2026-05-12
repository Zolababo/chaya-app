-- 점주 브라우저 웹 푸시 구독(신규 주문 등). INSERT/DELETE 는 승인 멤버 본인 행만(RLS).
-- 발송은 서버 service role 로 조회(merchant-notification-pipeline).

CREATE TABLE public.merchant_push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_slug text NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  CONSTRAINT merchant_push_subscriptions_user_tenant_endpoint_uq UNIQUE (user_id, tenant_slug, endpoint)
);

CREATE INDEX merchant_push_subscriptions_tenant_idx
  ON public.merchant_push_subscriptions (tenant_slug);

COMMENT ON TABLE public.merchant_push_subscriptions IS
  'Merchant web push subscriptions per tenant; VAPID keys live in app env only.';

ALTER TABLE public.merchant_push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_push_subscriptions_select_own"
  ON public.merchant_push_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.merchant_tenant_members m
      WHERE m.user_id = auth.uid()
        AND m.tenant_slug = merchant_push_subscriptions.tenant_slug
        AND m.approved_at IS NOT NULL
    )
  );

CREATE POLICY "merchant_push_subscriptions_insert_own"
  ON public.merchant_push_subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.merchant_tenant_members m
      WHERE m.user_id = auth.uid()
        AND m.tenant_slug = merchant_push_subscriptions.tenant_slug
        AND m.approved_at IS NOT NULL
    )
  );

CREATE POLICY "merchant_push_subscriptions_update_own"
  ON public.merchant_push_subscriptions
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.merchant_tenant_members m
      WHERE m.user_id = auth.uid()
        AND m.tenant_slug = merchant_push_subscriptions.tenant_slug
        AND m.approved_at IS NOT NULL
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.merchant_tenant_members m
      WHERE m.user_id = auth.uid()
        AND m.tenant_slug = merchant_push_subscriptions.tenant_slug
        AND m.approved_at IS NOT NULL
    )
  );

CREATE POLICY "merchant_push_subscriptions_delete_own"
  ON public.merchant_push_subscriptions
  FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.merchant_tenant_members m
      WHERE m.user_id = auth.uid()
        AND m.tenant_slug = merchant_push_subscriptions.tenant_slug
        AND m.approved_at IS NOT NULL
    )
  );
