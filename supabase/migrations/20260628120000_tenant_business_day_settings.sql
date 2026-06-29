-- 매장 영업 시간·매출 영업일 구분 시각 (KST HH:MM)

ALTER TABLE public.tenant_store_settings
  ADD COLUMN IF NOT EXISTS business_open text,
  ADD COLUMN IF NOT EXISTS business_close text,
  ADD COLUMN IF NOT EXISTS sales_day_cutoff text NOT NULL DEFAULT '04:00';

ALTER TABLE public.tenant_store_settings
  DROP CONSTRAINT IF EXISTS tenant_store_settings_business_open_fmt;
ALTER TABLE public.tenant_store_settings
  ADD CONSTRAINT tenant_store_settings_business_open_fmt
    CHECK (business_open IS NULL OR business_open ~ '^\d{2}:\d{2}$');

ALTER TABLE public.tenant_store_settings
  DROP CONSTRAINT IF EXISTS tenant_store_settings_business_close_fmt;
ALTER TABLE public.tenant_store_settings
  ADD CONSTRAINT tenant_store_settings_business_close_fmt
    CHECK (business_close IS NULL OR business_close ~ '^\d{2}:\d{2}$');

ALTER TABLE public.tenant_store_settings
  DROP CONSTRAINT IF EXISTS tenant_store_settings_sales_day_cutoff_fmt;
ALTER TABLE public.tenant_store_settings
  ADD CONSTRAINT tenant_store_settings_sales_day_cutoff_fmt
    CHECK (sales_day_cutoff ~ '^\d{2}:\d{2}$');

COMMENT ON COLUMN public.tenant_store_settings.business_open IS
  '영업 시작 시각 KST HH:MM (안내·설정용)';
COMMENT ON COLUMN public.tenant_store_settings.business_close IS
  '영업 마감 시각 KST HH:MM (안내용, 자정 넘김 가능)';
COMMENT ON COLUMN public.tenant_store_settings.sales_day_cutoff IS
  '매출·손님 영업일 구분 — KST 이 시각 전 결제·방문은 전날 영업일';
