-- 메뉴 등록 시각 — 손님 「신규」 스티커 (등록 N일 이내)
ALTER TABLE public."ChayaMenus"
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE public."ChayaMenus"
SET created_at = now() - interval '60 days'
WHERE created_at IS NULL;

ALTER TABLE public."ChayaMenus"
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN created_at SET NOT NULL;

COMMENT ON COLUMN public."ChayaMenus".created_at IS
  '메뉴 행 최초 등록 시각. 손님 목록 「신규」 스티커 판별용.';
