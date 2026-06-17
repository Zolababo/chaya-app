-- 점주 수동: 오늘의 메뉴 배너 · 사장님 추천 섹션
ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS is_todays_pick boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_store_recommended boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public."ChayaMenus".is_todays_pick IS
  'true면 손님 메뉴 상단 「오늘의 메뉴」 배너 후보(점주 지정, 최대 3개 표시).';
COMMENT ON COLUMN public."ChayaMenus".is_store_recommended IS
  'true면 손님 메뉴 「사장님 추천」 가로 목록에 표시(판매 집계와 별도).';

CREATE INDEX IF NOT EXISTS idx_chaya_menus_tenant_todays_pick
  ON public."ChayaMenus"(tenant_slug)
  WHERE is_todays_pick = true;

CREATE INDEX IF NOT EXISTS idx_chaya_menus_tenant_store_recommended
  ON public."ChayaMenus"(tenant_slug)
  WHERE is_store_recommended = true;
