-- Merchant live-readiness verification (run in Supabase SQL Editor)
-- 목적: 점주 실사용 전, tenant/권한/주문/메뉴 최소 상태를 한 번에 확인합니다.
-- `merchant_tenant_members.approved_at` 컬럼이 있어야 B·H가 의미 있습니다 (`20260512120000_merchant_tenant_members_approved_at.sql`).
--
-- 사용법:
-- 1) 아래 tenant 값을 실제 매장 slug로 바꿉니다.
-- 2) 전체 실행 후 각 섹션 결과(A~H)를 점검표에 기록합니다.

-- ====== params ======
-- 예: 'demo', 'gangnam-1ho'
with params as (
  select 'demo'::text as tenant_slug
)

-- ====== A. tenant에 연결된 점주 계정 ======
select
  'A.merchant_members' as section,
  m.tenant_slug,
  m.role,
  m.approved_at,
  u.email,
  m.created_at
from params p
join public.merchant_tenant_members m on m.tenant_slug = p.tenant_slug
left join auth.users u on u.id = m.user_id
order by m.created_at desc;

-- ====== B. owner 계정 존재 여부 ======
with params as (
  select 'demo'::text as tenant_slug
)
select
  'B.owner_exists' as section,
  p.tenant_slug,
  exists (
    select 1
    from public.merchant_tenant_members m
    where m.tenant_slug = p.tenant_slug
      and m.role = 'owner'
      and m.approved_at is not null
  ) as has_owner
from params p;

-- ====== C. 최근 24시간 주문 통계 ======
with params as (
  select 'demo'::text as tenant_slug
)
select
  'C.orders_24h' as section,
  p.tenant_slug,
  count(*) as order_count_24h,
  coalesce(sum(o.total_price), 0) as sales_24h
from params p
left join public.orders o
  on o.tenant_slug = p.tenant_slug
 and o.created_at >= now() - interval '24 hours'
group by p.tenant_slug;

-- ====== D. 메뉴 최소 구성 확인 ======
with params as (
  select 'demo'::text as tenant_slug
)
select
  'D.menu_count' as section,
  p.tenant_slug,
  count(*) as menu_count,
  count(*) filter (where coalesce(c.name, '') <> '') as category_filled_count
from params p
left join public."ChayaMenus" m on m.tenant_slug = p.tenant_slug
left join lateral (
  select m.category::text as name
) c on true
group by p.tenant_slug;

-- ====== E. 최근 주문 상태 분포 ======
with params as (
  select 'demo'::text as tenant_slug
)
select
  'E.order_status' as section,
  p.tenant_slug,
  o.status,
  count(*) as cnt
from params p
join public.orders o on o.tenant_slug = p.tenant_slug
where o.created_at >= now() - interval '7 days'
group by p.tenant_slug, o.status
order by o.status;

-- ====== F. ChayaMenus.is_sold_out 컬럼 존재 (앱 품절 기능) ======
select
  'F.is_sold_out_column' as section,
  exists (
    select 1
    from information_schema.columns c
    where c.table_schema = 'public'
      and c.table_name = 'ChayaMenus'
      and c.column_name = 'is_sold_out'
  ) as column_exists;

-- ====== G. 해당 tenant 품절 메뉴 수 (참고) ======
with params as (
  select 'demo'::text as tenant_slug
)
select
  'G.sold_out_menus' as section,
  p.tenant_slug,
  count(*) filter (where m.is_sold_out is true) as sold_out_count,
  count(*) as total_menus
from params p
left join public."ChayaMenus" m on m.tenant_slug = p.tenant_slug
group by p.tenant_slug;

-- ====== H. 승인 대기 멤버십 (접근 잠금 확인) ======
with params as (
  select 'demo'::text as tenant_slug
)
select
  'H.pending_members' as section,
  p.tenant_slug,
  count(*) filter (where m.approved_at is null) as pending_count,
  count(*) as total_members
from params p
join public.merchant_tenant_members m on m.tenant_slug = p.tenant_slug
group by p.tenant_slug;
