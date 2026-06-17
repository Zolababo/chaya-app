-- 소비자 경험 이벤트 (QR 진입·메뉴 조회·주문·재방문)
CREATE TABLE IF NOT EXISTS public.consumer_experience_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_session_id text NOT NULL,
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  tenant_slug text NOT NULL,
  event_type text NOT NULL,
  menu_id text,
  dwell_seconds int,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT consumer_experience_events_event_type_check
    CHECK (event_type IN ('qr_scan', 'menu_view', 'order_placed', 'revisit'))
);

CREATE INDEX IF NOT EXISTS idx_cee_guest_session
  ON public.consumer_experience_events (guest_session_id);

CREATE INDEX IF NOT EXISTS idx_cee_tenant_slug
  ON public.consumer_experience_events (tenant_slug);

CREATE INDEX IF NOT EXISTS idx_cee_user_id
  ON public.consumer_experience_events (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cee_event_type
  ON public.consumer_experience_events (event_type);

CREATE INDEX IF NOT EXISTS idx_cee_created_at
  ON public.consumer_experience_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_cee_tenant_guest_qr_scan
  ON public.consumer_experience_events (tenant_slug, guest_session_id, event_type)
  WHERE event_type = 'qr_scan';

ALTER TABLE public.consumer_experience_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consumer_experience_events_service_role_insert"
  ON public.consumer_experience_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "consumer_experience_events_user_select_own"
  ON public.consumer_experience_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.consumer_experience_events IS
  '손님 오프라인 경험 이벤트. INSERT는 서버(service role)만. menu_id는 ChayaMenus.id 문자열.';

COMMENT ON COLUMN public.consumer_experience_events.menu_id IS
  'menu_view 시 ChayaMenus.id (uuid 문자열 또는 데모 id).';

-- 익명 guest_session_id → 로그인 user_id 연결
CREATE OR REPLACE FUNCTION public.claim_experience_events_for_user(
  p_guest_session_id text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF length(trim(coalesce(p_guest_session_id, ''))) < 8 OR p_user_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.consumer_experience_events
  SET user_id = p_user_id
  WHERE guest_session_id = trim(p_guest_session_id)
    AND user_id IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_experience_events_for_user(text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_experience_events_for_user(text, uuid) TO authenticated;

COMMENT ON FUNCTION public.claim_experience_events_for_user(text, uuid) IS
  '비회원 경험 이벤트를 로그인 사용자에게 귀속.';
