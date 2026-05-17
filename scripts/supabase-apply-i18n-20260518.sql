-- Supabase SQL Editor: 다국어 메뉴 (translations_json)
-- supabase/migrations/20260518120000_chaya_menus_translations_json.sql

ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS translations_json jsonb;

COMMENT ON COLUMN public."ChayaMenus".translations_json IS
  'locale별 메뉴 텍스트. 예: {"en":{"name":"Bibimbap","description":"...","category":"Korean"},"ja":{...}}. ko는 name/description/category 컬럼 사용.';
