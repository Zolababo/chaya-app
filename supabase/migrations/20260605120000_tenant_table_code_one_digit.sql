-- 테이블 번호: 1~3자리 숫자 허용 (예: 1, 01, 120)

ALTER TABLE public.tenant_tables
  DROP CONSTRAINT IF EXISTS tenant_tables_code_format;

ALTER TABLE public.tenant_tables
  ADD CONSTRAINT tenant_tables_code_format CHECK (
    trim(table_code) ~ '^[0-9]{1,3}$'
  );

COMMENT ON TABLE public.tenant_tables IS
  '매장 테이블 번호 마스터. QR ?table= 과 주문 table_no 검증. 형식: 1~3자리 숫자(1, 01, 12, 120).';
