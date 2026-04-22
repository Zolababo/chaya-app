-- Consumer menu 경로 `/t/{tenant_slug}` 와 동기화하기 위한 테넌트 구분 컬럼입니다.
-- 기존 `ChayaMenus` 테이블이 이미 있다는 가정입니다. 이름이 다르면 이 파일의 식별자만 맞춰 주세요.

ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS tenant_slug text;

-- 기존 행은 데모/단일 매장 경로와 맞추기 위해 `demo`로 둡니다.
UPDATE public."ChayaMenus"
SET tenant_slug = 'demo'
WHERE tenant_slug IS NULL OR trim(tenant_slug) = '';

ALTER TABLE public."ChayaMenus"
  ALTER COLUMN tenant_slug SET DEFAULT 'demo';

ALTER TABLE public."ChayaMenus"
  ALTER COLUMN tenant_slug SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chaya_menus_tenant_slug
  ON public."ChayaMenus"(tenant_slug);

COMMENT ON COLUMN public."ChayaMenus".tenant_slug IS 'URL /t/{slug} 와 동일한 가게 식별자. QR·딥링크에 사용.';
