-- 매장 프로필·영업 설정 (점주 더보기 · 손님 브랜딩·주문 마감)
CREATE TABLE public.tenant_store_settings (
  tenant_slug text PRIMARY KEY,
  display_name text,
  logo_url text,
  intro text,
  orders_accepting boolean NOT NULL DEFAULT true,
  break_start text,
  break_end text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_store_settings_break_start_fmt
    CHECK (break_start IS NULL OR break_start ~ '^\d{2}:\d{2}$'),
  CONSTRAINT tenant_store_settings_break_end_fmt
    CHECK (break_end IS NULL OR break_end ~ '^\d{2}:\d{2}$')
);

ALTER TABLE public.tenant_store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_store_settings_public_read"
  ON public.tenant_store_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON TABLE public.tenant_store_settings IS
  '매장명·로고·소개·주문 접수·브레이크타임. 쓰기는 서버(service role)만.';
