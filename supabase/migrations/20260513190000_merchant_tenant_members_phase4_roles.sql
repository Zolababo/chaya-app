-- Phase 4: 세분 역할 — menu_editor(메뉴·카테고리만), viewer(조회 전용).
-- 앱: canManageMerchantMenus / canMutateMerchantOrders / canUseMerchantWebPush

DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname
  INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'merchant_tenant_members'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) LIKE '%role%'
  LIMIT 1;
  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.merchant_tenant_members DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE public.merchant_tenant_members
  ADD CONSTRAINT merchant_tenant_members_role_check
  CHECK (role IN ('owner', 'staff', 'menu_editor', 'viewer'));

COMMENT ON TABLE public.merchant_tenant_members IS
  'Merchant console: owner=orders+menus; staff=orders only; menu_editor=menus/categories; viewer=read-only (no order mutate, no push).';
