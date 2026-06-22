-- EXPLAIN ANALYZE: merchant analytics + guest insights (demo, 7-day window)
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
WITH base AS (
  SELECT created_at, total_price, status, cancel_reason
  FROM orders
  WHERE tenant_slug = 'demo'
    AND created_at >= (now() - interval '7 days')
    AND created_at <= now()
  ORDER BY created_at DESC
  LIMIT 2500
)
SELECT count(*) FROM base;
