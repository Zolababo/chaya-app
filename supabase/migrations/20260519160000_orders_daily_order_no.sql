-- 주문 번호: 매장·**영업일(KST)** 별 01, 02, 03 … (자정 리셋)

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_day date;

UPDATE public.orders o
SET order_day = (timezone('Asia/Seoul', coalesce(o.created_at, now()))::date)
WHERE o.order_day IS NULL;

CREATE TABLE IF NOT EXISTS public.tenant_order_daily_counters (
  tenant_slug text NOT NULL,
  order_day date NOT NULL,
  last_no integer NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_slug, order_day)
);

ALTER TABLE public.tenant_order_daily_counters ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.tenant_order_daily_counters IS
  '매장·영업일(KST)별 주문 번호 카운터. 손님 앱은 직접 조회하지 않음 — INSERT 트리거만 갱신.';

REVOKE ALL ON TABLE public.tenant_order_daily_counters FROM anon, authenticated;

INSERT INTO public.tenant_order_daily_counters (tenant_slug, order_day, last_no)
SELECT tenant_slug, order_day, COALESCE(MAX(order_no), 0)
FROM public.orders
WHERE order_day IS NOT NULL AND order_no IS NOT NULL
GROUP BY tenant_slug, order_day
ON CONFLICT (tenant_slug, order_day) DO UPDATE
  SET last_no = GREATEST(public.tenant_order_daily_counters.last_no, EXCLUDED.last_no);

DROP INDEX IF EXISTS orders_tenant_order_no_unique;

CREATE UNIQUE INDEX IF NOT EXISTS orders_tenant_day_order_no_unique
  ON public.orders (tenant_slug, order_day, order_no)
  WHERE order_no IS NOT NULL AND order_day IS NOT NULL;

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY tenant_slug, order_day
      ORDER BY created_at ASC NULLS LAST, id ASC
    ) AS rn
  FROM public.orders
  WHERE order_day IS NOT NULL
)
UPDATE public.orders o
SET order_no = ranked.rn
FROM ranked
WHERE o.id = ranked.id;

CREATE OR REPLACE FUNCTION public.orders_assign_order_no()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d date;
  n integer;
BEGIN
  IF NEW.order_no IS NOT NULL AND NEW.order_no > 0 AND NEW.order_day IS NOT NULL THEN
    RETURN NEW;
  END IF;

  d := (timezone('Asia/Seoul', coalesce(NEW.created_at, now())))::date;
  NEW.order_day := d;

  INSERT INTO public.tenant_order_daily_counters (tenant_slug, order_day, last_no)
  VALUES (NEW.tenant_slug, d, 0)
  ON CONFLICT (tenant_slug, order_day) DO NOTHING;

  UPDATE public.tenant_order_daily_counters
  SET last_no = last_no + 1
  WHERE tenant_slug = NEW.tenant_slug
    AND order_day = d
  RETURNING last_no INTO n;

  NEW.order_no := n;
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN public.orders.order_day IS
  '주문 영업일(KST). order_no 는 tenant_slug + order_day 기준 1부터.';
COMMENT ON COLUMN public.orders.order_no IS
  '해당 영업일 손님·점주 표시 번호(01, 02 …). 자정(KST)마다 리셋.';
