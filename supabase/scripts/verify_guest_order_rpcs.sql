-- 손님 주문 RPC·orders 스키마 빠른 점검 (읽기 전용)
-- Supabase SQL Editor에 붙여넣어 실행하세요. 상세·적용 순서: docs/BARRIER_FREE_NEXT_STEPS.md
--
-- 기대값(최신 앱 기준):
--   • 아래 ① 에서 public RPC 이름 3개 행
--   • ② 에서 get_order_for_guest / get_order_status_for_guest 는 args = uuid, text, text
--   • ② 에서 list_orders_for_guest 는 args = text, text, integer
--   • ③ orders 행이 있으면 tenant_slug·guest_session_id 등 컬럼 존재 확인
--   • ④ orders 에 RLS 켜짐(relrowsecurity = true)

-- ① anon 손님용 RPC 3종 등록 여부
SELECT p.proname
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_order_for_guest',
    'list_orders_for_guest',
    'get_order_status_for_guest'
  )
ORDER BY 1;

-- ② 시그니처(세션 인자까지 올렸는지 확인)
SELECT p.proname, pg_get_function_identity_arguments(p.oid) AS args
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_order_for_guest',
    'list_orders_for_guest',
    'get_order_status_for_guest'
  )
ORDER BY 1;

-- ③ orders 주요 컬럼(테이블 없으면 0행)
SELECT c.column_name, c.data_type
FROM information_schema.columns c
WHERE c.table_schema = 'public'
  AND c.table_name = 'orders'
  AND c.column_name IN (
    'tenant_slug',
    'guest_session_id',
    'guest_note',
    'table_no',
    'status',
    'items',
    'total_price'
  )
ORDER BY c.column_name;

-- ④ orders RLS 여부
SELECT c.relname, c.relrowsecurity AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname = 'orders';
