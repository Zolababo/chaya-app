-- 테이블 세션: 동일 테이블 추가 주문 → 결제는 세션 1회 (포장·테이블 없음 주문은 제외)

CREATE TABLE IF NOT EXISTS public.table_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug text NOT NULL,
  table_no text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'void')),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT table_sessions_table_no_trim CHECK (length(trim(table_no)) > 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_table_sessions_one_open_per_table
  ON public.table_sessions (tenant_slug, table_no)
  WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_table_sessions_tenant_paid
  ON public.table_sessions (tenant_slug, paid_at DESC NULLS LAST)
  WHERE status = 'paid';

COMMENT ON TABLE public.table_sessions IS
  '매장 테이블 단위 결제 세션. open 세션에 주문이 붙고, 점주 결제 시 paid.';

ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS table_session_id uuid REFERENCES public.table_sessions (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_table_session
  ON public.orders (table_session_id)
  WHERE table_session_id IS NOT NULL;

COMMENT ON COLUMN public.orders.table_session_id IS
  '테이블 세션(동일 테이블 추가 주문 묶음). NULL = 포장·레거시·테이블 없음.';

ALTER TABLE public.store_visits
  ADD COLUMN IF NOT EXISTS table_session_id uuid REFERENCES public.table_sessions (id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_store_visits_table_session_unique
  ON public.store_visits (table_session_id)
  WHERE table_session_id IS NOT NULL;

COMMENT ON COLUMN public.store_visits.table_session_id IS
  '테이블 세션 결제 1회당 방문 1행. order_id 는 대표 주문(최신).';
w