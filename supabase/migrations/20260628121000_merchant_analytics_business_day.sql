-- 영업일 키 + 분석 RPC — 매출(completed_at)·접수(created_at) 이원 집계

CREATE OR REPLACE FUNCTION public.business_day_key_kst(ts timestamptz, p_cutoff text DEFAULT '04:00')
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  WITH kst AS (
    SELECT (ts AT TIME ZONE 'Asia/Seoul') AS local_ts
  )
  SELECT to_char(
    CASE
      WHEN (local_ts::time < (coalesce(nullif(trim(p_cutoff), ''), '04:00') || ':00')::time)
      THEN (local_ts::date - 1)
      ELSE local_ts::date
    END,
    'YYYY-MM-DD'
  )
  FROM kst;
$$;

COMMENT ON FUNCTION public.business_day_key_kst(timestamptz, text) IS
  'KST 영업일 라벨 — p_cutoff 이전 시각은 전날 영업일';

-- p_cutoff 추가 = 시그니처 변경 → CREATE OR REPLACE만으로는 구(4인자) 버전이 남음.
-- COMMENT ON / bundle 내부 호출 모두 "function name is not unique" 유발.
DROP FUNCTION IF EXISTS public.merchant_analytics_core(text, timestamptz, timestamptz, int);

CREATE OR REPLACE FUNCTION public.merchant_analytics_core(
  p_tenant_slug text,
  p_since timestamptz,
  p_until timestamptz,
  p_limit int DEFAULT 2500,
  p_cutoff text DEFAULT '04:00'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH received AS (
    SELECT created_at, total_price, status, cancel_reason, table_session_id, id
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND created_at >= p_since
      AND created_at < p_until
    ORDER BY created_at DESC
    LIMIT GREATEST(1, LEAST(p_limit, 2500))
  ),
  payment_orders AS (
    SELECT
      total_price,
      table_session_id,
      completed_at,
      created_at
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND status = 'completed'
      AND (
        (
          completed_at IS NOT NULL
          AND completed_at >= p_since
          AND completed_at < p_until
        )
        OR (
          completed_at IS NULL
          AND created_at >= p_since
          AND created_at < p_until
        )
      )
  ),
  totals AS (
    SELECT
      (SELECT count(*)::int FROM received) AS order_count,
      coalesce((SELECT sum(total_price) FROM payment_orders), 0)::float8 AS total_sales,
      (
        COALESCE((
          SELECT count(*)::int
          FROM (
            SELECT DISTINCT table_session_id
            FROM payment_orders
            WHERE table_session_id IS NOT NULL
          ) paid_sessions
        ), 0)
        + COALESCE((
          SELECT count(*)::int
          FROM payment_orders
          WHERE table_session_id IS NULL
        ), 0)
      )::int AS completed_count,
      (SELECT count(*) FILTER (WHERE status = 'cancelled')::int FROM received) AS cancelled_count
  ),
  daily_received AS (
    SELECT
      public.business_day_key_kst(created_at, p_cutoff) AS day_key,
      count(*)::int AS orders
    FROM received
    GROUP BY 1
  ),
  daily_sales AS (
    SELECT
      public.business_day_key_kst(
        coalesce(completed_at, created_at),
        p_cutoff
      ) AS day_key,
      coalesce(sum(total_price), 0)::float8 AS sales
    FROM payment_orders
    GROUP BY 1
  ),
  daily AS (
    SELECT
      coalesce(r.day_key, s.day_key) AS day_key,
      coalesce(r.orders, 0)::int AS orders,
      coalesce(s.sales, 0)::float8 AS sales
    FROM daily_received r
    FULL OUTER JOIN daily_sales s ON r.day_key = s.day_key
    ORDER BY 1
  ),
  hourly_received AS (
    SELECT
      extract(hour FROM (created_at AT TIME ZONE 'Asia/Seoul'))::int AS hour,
      count(*)::int AS orders
    FROM received
    GROUP BY 1
  ),
  hourly_sales AS (
    SELECT
      extract(hour FROM (coalesce(completed_at, created_at) AT TIME ZONE 'Asia/Seoul'))::int AS hour,
      coalesce(sum(total_price), 0)::float8 AS sales
    FROM payment_orders
    GROUP BY 1
  ),
  hourly AS (
    SELECT
      coalesce(r.hour, s.hour)::int AS hour,
      coalesce(r.orders, 0)::int AS orders,
      coalesce(s.sales, 0)::float8 AS sales
    FROM hourly_received r
    FULL OUTER JOIN hourly_sales s ON r.hour = s.hour
    ORDER BY 1
  ),
  by_dow_received AS (
    SELECT
      extract(dow FROM (public.business_day_key_kst(created_at, p_cutoff))::date)::int AS dow,
      count(*)::int AS orders
    FROM received
    GROUP BY 1
  ),
  by_dow_sales AS (
    SELECT
      extract(
        dow FROM (
          public.business_day_key_kst(coalesce(completed_at, created_at), p_cutoff)
        )::date
      )::int AS dow,
      coalesce(sum(total_price), 0)::float8 AS sales
    FROM payment_orders
    GROUP BY 1
  ),
  by_dow AS (
    SELECT
      coalesce(r.dow, s.dow)::int AS dow,
      coalesce(r.orders, 0)::int AS orders,
      coalesce(s.sales, 0)::float8 AS sales
    FROM by_dow_received r
    FULL OUTER JOIN by_dow_sales s ON r.dow = s.dow
    ORDER BY 1
  ),
  cancel_reasons AS (
    SELECT
      coalesce(nullif(trim(cancel_reason), ''), 'other') AS reason,
      count(*)::int AS cnt
    FROM received
    WHERE status = 'cancelled'
    GROUP BY 1
    ORDER BY 2 DESC
  )
  SELECT jsonb_build_object(
    'totals', (SELECT to_jsonb(t) FROM totals t),
    'daily', coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.day_key) FROM daily d), '[]'::jsonb),
    'hourly', coalesce((SELECT jsonb_agg(to_jsonb(h) ORDER BY h.hour) FROM hourly h), '[]'::jsonb),
    'by_dow', coalesce((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.dow) FROM by_dow w), '[]'::jsonb),
    'cancel_reasons', coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM cancel_reasons c), '[]'::jsonb)
  );
$$;

COMMENT ON FUNCTION public.merchant_analytics_core(text, timestamptz, timestamptz, int, text) IS
  '점주 분석 — 접수(created_at)·매출(completed_at) 이원, 영업일 키(p_cutoff)';

CREATE OR REPLACE FUNCTION public.merchant_analytics_top_menus(
  p_tenant_slug text,
  p_since timestamptz,
  p_until timestamptz,
  p_order_limit int DEFAULT 600,
  p_top_n int DEFAULT 12
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH recent AS (
    SELECT items
    FROM orders
    WHERE tenant_slug = p_tenant_slug
      AND status = 'completed'
      AND (
        (completed_at IS NOT NULL AND completed_at >= p_since AND completed_at < p_until)
        OR (completed_at IS NULL AND created_at >= p_since AND created_at < p_until)
      )
    ORDER BY coalesce(completed_at, created_at) DESC
    LIMIT GREATEST(1, LEAST(p_order_limit, 600))
  ),
  lines AS (
    SELECT
      nullif(trim(elem->>'id'), '') AS menu_id,
      GREATEST(
        1,
        LEAST(
          99,
          coalesce(
            (CASE
              WHEN jsonb_typeof(elem->'quantity') = 'number' THEN (elem->>'quantity')::int
              WHEN jsonb_typeof(elem->'quantity') = 'string' THEN (elem->>'quantity')::int
              ELSE 1
            END),
            1
          )
        )
      ) AS qty
    FROM recent r
    CROSS JOIN LATERAL jsonb_array_elements(
      CASE WHEN jsonb_typeof(r.items) = 'array' THEN r.items ELSE '[]'::jsonb END
    ) AS elem
  ),
  agg AS (
    SELECT menu_id, sum(qty)::int AS qty
    FROM lines
    WHERE menu_id IS NOT NULL
    GROUP BY menu_id
    ORDER BY qty DESC, menu_id
    LIMIT GREATEST(1, LEAST(p_top_n, 12))
  )
  SELECT coalesce(
    (
      SELECT jsonb_agg(
        jsonb_build_object('menu_id', menu_id, 'qty', qty)
        ORDER BY qty DESC, menu_id
      )
      FROM agg
    ),
    '[]'::jsonb
  );
$$;

DROP FUNCTION IF EXISTS public.merchant_analytics_bundle(
  text, timestamptz, timestamptz, timestamptz, timestamptz, int, int, int
);

CREATE OR REPLACE FUNCTION public.merchant_analytics_bundle(
  p_tenant_slug text,
  p_since timestamptz,
  p_until timestamptz,
  p_prev_since timestamptz,
  p_prev_until timestamptz,
  p_core_limit int DEFAULT 2500,
  p_top_order_limit int DEFAULT 600,
  p_top_n int DEFAULT 12,
  p_cutoff text DEFAULT '04:00'
)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'current',
    public.merchant_analytics_core(
      p_tenant_slug,
      p_since,
      p_until,
      GREATEST(1, LEAST(p_core_limit, 2500)),
      p_cutoff
    ),
    'previous',
    public.merchant_analytics_core(
      p_tenant_slug,
      p_prev_since,
      p_prev_until,
      GREATEST(1, LEAST(p_core_limit, 2500)),
      p_cutoff
    ),
    'top_menus',
    public.merchant_analytics_top_menus(
      p_tenant_slug,
      p_since,
      p_until,
      GREATEST(1, LEAST(p_top_order_limit, 600)),
      GREATEST(1, LEAST(p_top_n, 12))
    )
  );
$$;
