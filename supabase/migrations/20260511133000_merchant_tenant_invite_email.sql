ALTER TABLE public.merchant_tenant_members
ADD COLUMN IF NOT EXISTS invite_email text;

COMMENT ON COLUMN public.merchant_tenant_members.invite_email IS '이메일 초대 경로 시 표시용(소문자 권장).';
