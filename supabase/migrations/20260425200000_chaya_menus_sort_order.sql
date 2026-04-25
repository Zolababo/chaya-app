-- 메뉴 표시 순서(오름차순). 기존 행은 0으로 두고 이름 등으로 보조 정렬합니다.
ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public."ChayaMenus".sort_order IS '같은 tenant_slug 내 표시 순서. 작을수록 앞에 표시.';

CREATE INDEX IF NOT EXISTS idx_chaya_menus_tenant_sort
  ON public."ChayaMenus"(tenant_slug, sort_order);
