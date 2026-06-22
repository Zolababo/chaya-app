-- 소비자 메뉴 보드 — ChayaMenus 목록 (board select, tenant_slug 필터)
-- Usage: npx supabase@latest db query --linked -f supabase/scripts/explain-consumer-menus.sql

EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT
  id,
  name,
  description,
  price,
  category,
  "imageUrl",
  sort_order,
  is_sold_out,
  is_todays_pick,
  is_store_recommended,
  created_at
FROM "ChayaMenus"
WHERE tenant_slug = 'demo'
ORDER BY sort_order ASC NULLS LAST, name ASC;
