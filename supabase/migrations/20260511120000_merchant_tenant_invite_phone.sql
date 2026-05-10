-- 운영자(/ops)가 초대한 휴대폰 번호 표시용(표에 user_id 만 있으면 식별이 어려움).
ALTER TABLE public.merchant_tenant_members
ADD COLUMN IF NOT EXISTS invite_phone text;

COMMENT ON COLUMN public.merchant_tenant_members.invite_phone IS '점주 초대 시 E.164(+82…) 저장. 선택적.';
