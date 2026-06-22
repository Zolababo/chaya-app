EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT merchant_analytics_core(
  'demo',
  (now() - interval '7 days')::timestamptz,
  now()::timestamptz,
  2500
);
