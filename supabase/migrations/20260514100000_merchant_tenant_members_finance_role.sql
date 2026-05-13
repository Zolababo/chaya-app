-- Phase 4: 정산·매출 조회용 read-only 역할 finance (viewer 와 동일 권한 매트릭스, 초대·감사 구분용).

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
  CHECK (role IN ('owner', 'staff', 'menu_editor', 'viewer', 'finance'));

COMMENT ON TABLE public.merchant_tenant_members IS
  'Merchant: owner=full; staff=orders; menu_editor=menus no delete; viewer=read-only; finance=read-only (정산 조회용, 앱 권한은 viewer와 동일).';
