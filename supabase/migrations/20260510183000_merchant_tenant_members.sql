-- Maps Supabase Auth users to tenant slugs for the integrated merchant console (`/m/*`).
-- Rows are added by operators (SQL Editor / service role); the app only SELECTs with RLS.

CREATE TABLE public.merchant_tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  tenant_slug text NOT NULL,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'staff')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_slug)
);

CREATE INDEX merchant_tenant_members_user_id_idx ON public.merchant_tenant_members (user_id);
CREATE INDEX merchant_tenant_members_tenant_slug_idx ON public.merchant_tenant_members (tenant_slug);

ALTER TABLE public.merchant_tenant_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "merchant_tenant_members_select_own"
  ON public.merchant_tenant_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

COMMENT ON TABLE public.merchant_tenant_members IS
  'Merchant console access: owner = orders + menus; staff = orders only.';
