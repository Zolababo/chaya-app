-- list_orders_for_guest RPC: tenant_slug + guest_session_id + 최근순 정렬에 맞춘 부분 인덱스

CREATE INDEX IF NOT EXISTS idx_orders_tenant_guest_created
  ON public.orders (tenant_slug, guest_session_id, created_at DESC)
  WHERE guest_session_id IS NOT NULL;

COMMENT ON INDEX idx_orders_tenant_guest_created IS
  '비회원 주문 목록 RPC 조회용 (tenant_slug, guest_session_id 고정 시 created_at 역순).';
