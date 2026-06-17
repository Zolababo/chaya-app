-- Ops·정산용 매장 플랜 (기능 게이트는 추후)
ALTER TABLE public.tenant_store_settings
  ADD COLUMN IF NOT EXISTS billing_plan text NOT NULL DEFAULT 'starter';

ALTER TABLE public.tenant_store_settings
  DROP CONSTRAINT IF EXISTS tenant_store_settings_billing_plan_check;

ALTER TABLE public.tenant_store_settings
  ADD CONSTRAINT tenant_store_settings_billing_plan_check
  CHECK (billing_plan IN ('trial', 'starter', 'growth'));

COMMENT ON COLUMN public.tenant_store_settings.billing_plan IS
  'Ops 플랜: trial(체험) | starter(기본) | growth(성장). 쓰기는 서버(service role)만.';
