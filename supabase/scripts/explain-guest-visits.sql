EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT guest_session_id, completed_at, total_price, items
FROM store_visits
WHERE tenant_slug = 'demo'
  AND completed_at >= (now() - interval '7 days')
  AND completed_at <= now()
ORDER BY completed_at DESC;
