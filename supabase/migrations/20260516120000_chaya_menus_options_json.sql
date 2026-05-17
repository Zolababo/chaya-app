-- 메뉴 옵션 그룹(JSON). 손님 상세·장바구니·주문 items 스냅샷에 반영.

ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS options_json jsonb;

COMMENT ON COLUMN public."ChayaMenus".options_json IS
  '옵션 그룹 배열 JSON. 예: [{"id":"spice","name":"맵기","required":true,"choices":[{"id":"mild","label":"순한맛"},{"id":"hot","label":"매운맛","priceDelta":0}]}]';
