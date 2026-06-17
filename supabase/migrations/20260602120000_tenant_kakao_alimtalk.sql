-- 카카오 알림톡 연동 시각 (운영·플랫폼이 설정, 점주는 조회만)
ALTER TABLE public.tenant_store_settings
  ADD COLUMN IF NOT EXISTS kakao_alimtalk_linked_at timestamptz;

COMMENT ON COLUMN public.tenant_store_settings.kakao_alimtalk_linked_at IS
  '카카오 알림톡 채널 연동 완료 시각. NULL이면 미연동. 쓰기는 서버(service role)만.';
