-- 매장별 테이블 마스터(QR·손님 선택·주문 검증). 점주 CRUD는 서버(service role), 손님은 활성 목록만 SELECT.

CREATE TABLE IF NOT EXISTS public.tenant_tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug text NOT NULL,
  table_code text NOT NULL,
  label text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_tables_code_len CHECK (
    length(trim(table_code)) >= 1 AND length(trim(table_code)) <= 30
  ),
  CONSTRAINT tenant_tables_code_format CHECK (
    trim(table_code) ~ '^[0-9]{2,3}$'
  ),
  UNIQUE (tenant_slug, table_code)
);

CREATE INDEX IF NOT EXISTS tenant_tables_tenant_active_idx
  ON public.tenant_tables (tenant_slug, sort_order, table_code)
  WHERE is_active = true;

ALTER TABLE public.tenant_tables ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.tenant_tables IS
  '매장 테이블 번호 마스터. QR ?table= 과 주문 table_no 검증. 형식: 2~3자리 숫자(01, 12, 120).';

-- SQL Editor에서 스크립트를 다시 실행할 때 42710(이미 있음) 방지
DROP POLICY IF EXISTS tenant_tables_anon_select_active ON public.tenant_tables;

CREATE POLICY tenant_tables_anon_select_active
  ON public.tenant_tables
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND length(trim(tenant_slug)) > 0);

REVOKE INSERT, UPDATE, DELETE ON public.tenant_tables FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.tenant_has_active_tables(p_tenant text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_tables t
    WHERE t.tenant_slug = trim(p_tenant)
      AND t.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.tenant_table_is_valid(p_tenant text, p_code text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.tenant_tables t
    WHERE t.tenant_slug = trim(p_tenant)
      AND t.table_code = trim(p_code)
      AND t.is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.tenant_has_active_tables(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.tenant_table_is_valid(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.tenant_has_active_tables(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tenant_table_is_valid(text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.tenant_has_active_tables IS
  '손님 주문: 매장에 활성 테이블이 하나라도 있으면 true.';
COMMENT ON FUNCTION public.tenant_table_is_valid IS
  '손님 주문: table_no 가 활성 마스터에 있으면 true.';
