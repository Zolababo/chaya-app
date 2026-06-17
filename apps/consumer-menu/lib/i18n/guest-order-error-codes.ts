/** 서버 액션·주문 제출 실패 코드 (클라이언트에서 locale 메시지로 변환). */
export type GuestOrderErrorCode =
  | "empty_cart"
  | "too_many_items"
  | "invalid_line"
  | "invalid_price"
  | "invalid_qty"
  | "invalid_note"
  | "invalid_total"
  | "invalid_tenant"
  | "payload_too_large"
  | "payload_invalid"
  | "lines_invalid"
  | "no_supabase"
  | "sold_out_check_failed"
  | "sold_out_in_cart"
  | "menu_stale"
  | "price_check_failed"
  | "submit_failed"
  | "no_order_id"
  | "table_required"
  | "invalid_table"
  | "invalid_table_format"
  | "orders_closed"
  | "break_time";

export type GuestOrderErrorParams = {
  max?: string;
};
