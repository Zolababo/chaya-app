-- 카운터 테이블: RLS만 켜고 정책이 없으면 INSERT 트리거(SECURITY DEFINER)가 갱신에 실패할 수 있음.
-- 손님 API는 REVOKE 로 막고, 내부 카운터는 RLS 비활성화.

ALTER TABLE public.tenant_order_daily_counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_order_counters DISABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.tenant_order_daily_counters FROM anon, authenticated;
REVOKE ALL ON TABLE public.tenant_order_counters FROM anon, authenticated;
