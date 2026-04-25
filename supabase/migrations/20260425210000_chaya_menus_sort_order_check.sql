-- Requires `20260425200000_chaya_menus_sort_order.sql` (sort_order column).
-- 앱과 동일 범위(0~2_000_000). 비정상 값 INSERT 방지.
ALTER TABLE public."ChayaMenus"
  DROP CONSTRAINT IF EXISTS chaya_menus_sort_order_range;

ALTER TABLE public."ChayaMenus"
  ADD CONSTRAINT chaya_menus_sort_order_range
  CHECK (sort_order >= 0 AND sort_order <= 2000000);
