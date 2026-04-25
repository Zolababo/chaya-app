-- 소비자 메뉴 앱(anon 키)이 `ChayaMenus` 를 읽을 수 있게 합니다.
-- SELECT 만 허용하고, 쓰기는 정책 없음 → anon/authenticated 에서 거부됩니다.
-- service_role 은 RLS 를 우회합니다(점주·마이그레이션용).

ALTER TABLE public."ChayaMenus" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS chaya_menus_public_select ON public."ChayaMenus";

CREATE POLICY chaya_menus_public_select
  ON public."ChayaMenus"
  FOR SELECT
  TO anon, authenticated
  USING (true);

COMMENT ON POLICY chaya_menus_public_select ON public."ChayaMenus" IS
  '공개 메뉴 조회. 테넌트 분리는 앱 쿼리의 tenant_slug 필터 + URL 로 처리합니다.';
