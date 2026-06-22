-- 점주 주문 큐·ops count 성능 (status 필터 + 당일 completed)

CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_created
  ON public.orders (tenant_slug, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_status_completed
  ON public.orders (tenant_slug, status, completed_at DESC)
  WHERE completed_at IS NOT NULL;

COMMENT ON INDEX idx_orders_tenant_status_created IS
  '점주 ops count·주문 탭 목록 (status + created_at)';

COMMENT ON INDEX idx_orders_tenant_status_completed IS
  '점주 오늘 결제완료 탭 (completed_at KST bounds)';
