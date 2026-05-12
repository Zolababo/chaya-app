-- 점주 멤버십: 운영자 승인 후에만 `/m/{tenant}/*` 접근 (NULL = 승인 대기).
-- 이 마이그레이션 적용 시점에 이미 존재하던 행은 `created_at`으로 소급 채워 기존 동작(즉시 이용)을 유지합니다.

ALTER TABLE public.merchant_tenant_members
ADD COLUMN IF NOT EXISTS approved_at timestamptz NULL;

COMMENT ON COLUMN public.merchant_tenant_members.approved_at IS
  'NULL이면 운영 승인 전 — 점주 테넌트 라우트 접근 불가. 값이 있으면 접근 허용.';

UPDATE public.merchant_tenant_members
SET approved_at = created_at
WHERE approved_at IS NULL;
