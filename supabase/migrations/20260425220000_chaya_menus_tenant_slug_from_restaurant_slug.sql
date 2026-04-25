-- 앱·기존 마이그레이션은 `tenant_slug` 만 사용합니다. 레거시 `restaurant_slug` 만 채워진 행을 맞춥니다.
-- `restaurant_slug` 컬럼이 없으면 DO 블록은 아무 것도 하지 않습니다.

ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS tenant_slug text;

DO $body$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'ChayaMenus'
      AND column_name = 'restaurant_slug'
  ) THEN
    EXECUTE $sql$
      UPDATE public."ChayaMenus"
      SET tenant_slug = COALESCE(
        NULLIF(btrim(tenant_slug::text), ''),
        NULLIF(btrim(restaurant_slug::text), ''),
        'demo'
      )
      WHERE tenant_slug IS NULL
         OR btrim(tenant_slug::text) = '';
    $sql$;
  END IF;
END
$body$;

UPDATE public."ChayaMenus"
SET tenant_slug = 'demo'
WHERE tenant_slug IS NULL
   OR btrim(tenant_slug::text) = '';

ALTER TABLE public."ChayaMenus"
  ALTER COLUMN tenant_slug SET DEFAULT 'demo';

ALTER TABLE public."ChayaMenus"
  ALTER COLUMN tenant_slug SET NOT NULL;

COMMENT ON COLUMN public."ChayaMenus".tenant_slug IS 'URL /t/{slug}. 레거시 restaurant_slug 과 다를 때는 tenant_slug 를 기준으로 하세요.';
