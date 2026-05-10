-- 플랫폼 운영자: 점주 멤버십(merchant_tenant_members)을 대시보드에서 관리할 수 있게 합니다.
-- 첫 운영자는 SQL 로 auth.users UUID 를 넣어 부트스트랩합니다.

CREATE TABLE public.platform_operators (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX platform_operators_user_id_idx ON public.platform_operators (user_id);

ALTER TABLE public.platform_operators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_operators_select_self"
  ON public.platform_operators
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.platform_operators IS
  'Row here = can use /ops admin UI; add via SQL after creating auth user.';

-- 운영자는 모든 점주 멤버십 행을 읽고/쓸 수 있음(기존 "본인만 SELECT" 정책과 OR 로 합산).
CREATE POLICY "merchant_members_platform_manage"
  ON public.merchant_tenant_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.platform_operators po WHERE po.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.platform_operators po WHERE po.user_id = auth.uid()
    )
  );
