-- 다국어 메뉴판: 점주 입력 translations_json, 손님 locale 폴백(ko 기본 name/description/category)

ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS translations_json jsonb;

COMMENT ON COLUMN public."ChayaMenus".translations_json IS
  'locale별 메뉴 텍스트. 예: {"en":{"name":"Bibimbap","description":"...","category":"Korean"},"ja":{...}}. ko는 name/description/category 컬럼 사용.';
