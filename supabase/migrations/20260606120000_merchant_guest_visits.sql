-- 결제완료 사이클(방문) · 손님 집계 — 점주 단골·재방문 (현장 QR 주문)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

COMMENT ON COLUMN public.orders.completed_at IS
  '점주가 status=completed(결제완료) 처리한 시각. 방문 사이클·재방문 집계 기준.';

UPDATE public.orders
SET completed_at = created_at
WHERE status = 'completed'
  AND completed_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_tenant_guest_completed
  ON public.orders (tenant_slug, guest_session_id, completed_at DESC)
  WHERE status = 'completed' AND guest_session_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.store_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug text NOT NULL,
  guest_session_id text NOT NULL,
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  visit_number int NOT NULL CHECK (visit_number >= 1),
  completed_at timestamptz NOT NULL,
  total_price numeric NOT NULL CHECK (total_price >= 0),
  table_no text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT store_visits_order_id_unique UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS idx_store_visits_tenant_guest
  ON public.store_visits (tenant_slug, guest_session_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_store_visits_tenant_completed
  ON public.store_visits (tenant_slug, completed_at DESC);

COMMENT ON TABLE public.store_visits IS
  '결제완료(status=completed) 1건당 1행. 재방문·N번째 방문 집계. INSERT는 서버(service role)만.';

ALTER TABLE public.store_visits ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.tenant_guest_rollups (
  tenant_slug text NOT NULL,
  guest_session_id text NOT NULL,
  completed_visit_count int NOT NULL DEFAULT 0 CHECK (completed_visit_count >= 0),
  lifetime_spend numeric NOT NULL DEFAULT 0 CHECK (lifetime_spend >= 0),
  last_completed_at timestamptz,
  last_total_price numeric,
  last_items jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_slug, guest_session_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_guest_rollups_tenant_last
  ON public.tenant_guest_rollups (tenant_slug, last_completed_at DESC NULLS LAST);

COMMENT ON TABLE public.tenant_guest_rollups IS
  '매장별 익명 손님 결제완료 집계. UI에는 guest_label(앱 해시)만 노출. service role 전용.';

ALTER TABLE public.tenant_guest_rollups ENABLE ROW LEVEL SECURITY;

INSERT INTO public.store_visits (
  tenant_slug,
  guest_session_id,
  order_id,
  visit_number,
  completed_at,
  total_price,
  table_no,
  items
)
SELECT
  o.tenant_slug,
  trim(o.guest_session_id),
  o.id,
  row_number() OVER (
    PARTITION BY o.tenant_slug, trim(o.guest_session_id)
    ORDER BY COALESCE(o.completed_at, o.created_at), o.id
  )::int,
  COALESCE(o.completed_at, o.created_at),
  o.total_price,
  o.table_no,
  COALESCE(o.items::jsonb, '[]'::jsonb)
FROM public.orders o
WHERE o.status = 'completed'
  AND o.guest_session_id IS NOT NULL
  AND length(trim(o.guest_session_id)) >= 8
ON CONFLICT (order_id) DO NOTHING;

INSERT INTO public.tenant_guest_rollups (
  tenant_slug,
  guest_session_id,
  completed_visit_count,
  lifetime_spend,
  last_completed_at,
  last_total_price,
  last_items,
  updated_at
)
SELECT
  sv.tenant_slug,
  sv.guest_session_id,
  count(*)::int,
  coalesce(sum(sv.total_price), 0),
  max(sv.completed_at),
  (
    SELECT sv2.total_price
    FROM public.store_visits sv2
    WHERE sv2.tenant_slug = sv.tenant_slug
      AND sv2.guest_session_id = sv.guest_session_id
    ORDER BY sv2.completed_at DESC, sv2.order_id DESC
    LIMIT 1
  ),
  (
    SELECT sv2.items
    FROM public.store_visits sv2
    WHERE sv2.tenant_slug = sv.tenant_slug
      AND sv2.guest_session_id = sv.guest_session_id
    ORDER BY sv2.completed_at DESC, sv2.order_id DESC
    LIMIT 1
  ),
  now()
FROM public.store_visits sv
GROUP BY sv.tenant_slug, sv.guest_session_id
ON CONFLICT (tenant_slug, guest_session_id) DO UPDATE SET
  completed_visit_count = EXCLUDED.completed_visit_count,
  lifetime_spend = EXCLUDED.lifetime_spend,
  last_completed_at = EXCLUDED.last_completed_at,
  last_total_price = EXCLUDED.last_total_price,
  last_items = EXCLUDED.last_items,
  updated_at = EXCLUDED.updated_at;
