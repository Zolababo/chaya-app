-- 점주 품절(재고 없음) 표시: 손님 메뉴에서 담기 비활성화에 사용합니다.

ALTER TABLE public."ChayaMenus"
ADD COLUMN IF NOT EXISTS is_sold_out boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public."ChayaMenus".is_sold_out IS 'true면 품절: 손님 장바구니 담기 비활성화 권장.';
