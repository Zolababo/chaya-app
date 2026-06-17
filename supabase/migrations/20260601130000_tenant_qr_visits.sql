-- QR 메뉴 접속 집계 (손님 ?table= 유입). INSERT는 서버 service role 전용.

CREATE TABLE public.tenant_qr_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visited_at timestamptz NOT NULL DEFAULT now(),
  tenant_slug text NOT NULL,
  table_code text NOT NULL,
  day_key date NOT NULL
);

CREATE INDEX tenant_qr_visits_day_idx ON public.tenant_qr_visits (day_key DESC);
CREATE INDEX tenant_qr_visits_tenant_day_idx ON public.tenant_qr_visits (tenant_slug, day_key DESC);

COMMENT ON TABLE public.tenant_qr_visits IS
  'Consumer QR/table menu visits. Written server-side only; aggregated for /ops revenue.';

ALTER TABLE public.tenant_qr_visits ENABLE ROW LEVEL SECURITY;

-- RLS ON, no policies: anon/authenticated cannot read/write; service role bypasses.
