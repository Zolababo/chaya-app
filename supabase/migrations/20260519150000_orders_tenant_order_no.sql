-- 매장별 손님용 주문 번호 (25, 32 …) — 카운터 + INSERT 트리거

CREATE TABLE IF NOT EXISTS public.tenant_order_counters (
  tenant_slug text PRIMARY KEY,
  last_no integer NOT NULL DEFAULT 0
);

ALTER TABLE public.tenant_order_counters ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.tenant_order_counters IS
  '매장별 주문 번호 카운터(레거시). 손님 앱은 직접 조회하지 않음 — INSERT 트리거만 갱신.';

REVOKE ALL ON TABLE public.tenant_order_counters FROM anon, authenticated;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_no integer;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_slug
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.orders
  WHERE order_no IS NULL
)
UPDATE public.orders o
SET order_no = ranked.rn
FROM ranked
WHERE o.id = ranked.id;

INSERT INTO public.tenant_order_counters (tenant_slug, last_no)
SELECT tenant_slug, COALESCE(MAX(order_no), 0)
FROM public.orders
GROUP BY tenant_slug
ON CONFLICT (tenant_slug) DO UPDATE
  SET last_no = GREATEST(public.tenant_order_counters.last_no, EXCLUDED.last_no);

CREATE UNIQUE INDEX IF NOT EXISTS orders_tenant_order_no_unique
  ON public.orders (tenant_slug, order_no)
  WHERE order_no IS NOT NULL;

CREATE OR REPLACE FUNCTION public.orders_assign_order_no()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  IF NEW.order_no IS NOT NULL AND NEW.order_no > 0 THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.tenant_order_counters (tenant_slug, last_no)
  VALUES (NEW.tenant_slug, 0)
  ON CONFLICT (tenant_slug) DO NOTHING;

  UPDATE public.tenant_order_counters
  SET last_no = last_no + 1
  WHERE tenant_slug = NEW.tenant_slug
  RETURNING last_no INTO n;

  NEW.order_no := n;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_orders_assign_order_no ON public.orders;
CREATE TRIGGER trg_orders_assign_order_no
  BEFORE INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.orders_assign_order_no();

COMMENT ON COLUMN public.orders.order_no IS
  '매장(tenant_slug)별 손님·점주에 보이는 주문 번호. 1부터 증가.';
