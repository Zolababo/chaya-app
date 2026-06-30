import type { AppLocale } from "./locales";
import type { GuestOrderErrorCode, GuestOrderErrorParams } from "./guest-order-error-codes";

export type OrderErrorMessages = Record<GuestOrderErrorCode, string> & {
  too_many_items: string; // uses {max}
};

export type OrderProgressMessages = {
  ariaLabel: string;
  cancelled: string;
  stepReceived: string;
  stepPreparing: string;
  stepReady: string;
};

export type CopyOrderMessages = {
  copy: string;
  share: string;
  copyAria: string;
  shareAria: string;
  noUrl: string;
  copied: string;
  copyUnsupported: string;
  shareUnsupported: string;
  shared: string;
  shareFailed: string;
  shareTitle: string;
  shareText: string;
};

export type ErrorsMessageTree = {
  orderErrors: OrderErrorMessages;
  progress: OrderProgressMessages;
  copyOrder: CopyOrderMessages;
};

const KO_ERRORS: OrderErrorMessages = {
  empty_cart: "담은 메뉴가 없습니다.",
  too_many_items: "한 주문에는 메뉴를 최대 {max}개까지 담을 수 있습니다.",
  invalid_line: "메뉴 정보가 올바르지 않습니다.",
  invalid_price: "가격 정보가 올바르지 않습니다.",
  invalid_qty: "수량이 올바르지 않습니다.",
  invalid_note: "요청 메모 형식이 올바르지 않습니다.",
  invalid_total: "주문 합계가 허용 범위를 넘습니다.",
  invalid_tenant: "유효한 가게 정보가 없습니다.",
  payload_too_large: "주문 데이터가 너무 큽니다.",
  payload_invalid: "주문 데이터 형식이 올바르지 않습니다.",
  lines_invalid: "주문 품목이 올바르지 않습니다.",
  no_supabase: "Supabase 환경 변수가 없어 주문을 보낼 수 없습니다.",
  sold_out_check_failed: "메뉴 상태를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  sold_out_in_cart:
    "품절로 표시된 메뉴가 포함되어 있습니다. 메뉴판을 새로고침한 뒤 장바구니를 다시 담아 주세요.",
  menu_stale: "메뉴판이 바뀌었거나 일부 메뉴를 찾을 수 없습니다. 장바구니를 비운 뒤 다시 담아 주세요.",
  price_check_failed: "메뉴 가격을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  submit_failed: "주문을 접수하지 못했습니다. 잠시 후 다시 시도해 주세요.",
  no_order_id: "주문 번호를 받지 못했습니다.",
  table_required: "테이블을 선택해 주세요.",
  invalid_table: "등록되지 않은 테이블 번호입니다. QR을 다시 스캔하거나 목록에서 선택해 주세요.",
  invalid_table_format: "테이블 번호 형식이 올바르지 않습니다 (1~3자리 숫자).",
  orders_closed: "지금은 주문을 받지 않습니다. 매장에 문의해 주세요.",
  break_time: "브레이크타임입니다. 잠시 후 다시 주문해 주세요.",
  rate_limit: "잠시 후 다시 주문해 주세요. (요청이 많습니다)",
  table_qr_invalid: "테이블 QR을 스캔해 주세요. 주소창 링크 복사만으로는 주문할 수 없습니다.",
  table_qr_expired: "QR이 만료되었습니다. 테이블 QR을 다시 스캔해 주세요.",
  visit_closed: "QR이 만료되었습니다. 테이블 QR을 다시 스캔해 주세요.",
};

const EN_ERRORS: OrderErrorMessages = {
  empty_cart: "Your cart is empty.",
  too_many_items: "You can add up to {max} items per order.",
  invalid_line: "Some menu item data is invalid.",
  invalid_price: "Price data is invalid.",
  invalid_qty: "Quantity is invalid.",
  invalid_note: "Special request text is invalid.",
  invalid_total: "Order total exceeds the allowed limit.",
  invalid_tenant: "Store information is invalid.",
  payload_too_large: "Order data is too large.",
  payload_invalid: "Order data format is invalid.",
  lines_invalid: "Order items are invalid.",
  no_supabase: "Cannot submit: Supabase is not configured.",
  sold_out_check_failed: "Could not verify menu availability. Try again shortly.",
  sold_out_in_cart: "Your cart includes sold-out items. Refresh the menu and add items again.",
  menu_stale: "The menu changed or some items are missing. Clear the cart and try again.",
  price_check_failed: "Could not verify menu prices. Try again shortly.",
  submit_failed: "Could not place your order. Try again shortly.",
  no_order_id: "Did not receive an order id.",
  table_required: "Please select your table.",
  invalid_table: "This table number is not registered. Scan the table QR or pick from the list.",
  invalid_table_format: "Table number must be 1–3 digits (e.g. 1, 01, 12).",
  orders_closed: "This store is not accepting orders right now. Please ask staff.",
  break_time: "Break time — please order again in a few minutes.",
  rate_limit: "Please wait a moment and try again. (Too many requests)",
  table_qr_invalid: "Scan the table QR to order. Copying the menu link from the address bar is not enough.",
  table_qr_expired: "This QR has expired. Please scan the table QR again.",
  visit_closed: "This QR has expired. Please scan the table QR again.",
};

const KO: ErrorsMessageTree = {
  orderErrors: KO_ERRORS,
  progress: {
    ariaLabel: "주문 진행 단계",
    cancelled: "주문이 취소되었습니다.",
    stepReceived: "접수",
    stepPreparing: "조리",
    stepReady: "서빙 완료",
  },
  copyOrder: {
    copy: "이 주문 주소 복사",
    share: "다른 앱으로 공유",
    copyAria: "지금 보이는 주문 페이지 주소를 클립보드에 복사",
    shareAria: "다른 앱으로 주문 페이지 링크 공유",
    noUrl: "주소를 불러오지 못했습니다.",
    copied: "주문 페이지 주소를 복사했습니다.",
    copyUnsupported: "이 브라우저에서는 복사를 쓸 수 없습니다. 주소 표시줄에서 직접 복사해 주세요.",
    shareUnsupported: "이 기기에서는 시스템 공유를 쓸 수 없습니다.",
    shared: "공유했습니다.",
    shareFailed: "공유를 완료하지 못했습니다.",
    shareTitle: "주문 확인",
    shareText: "주문 페이지 링크입니다.",
  },
};

const EN: ErrorsMessageTree = {
  orderErrors: EN_ERRORS,
  progress: {
    ariaLabel: "Order progress",
    cancelled: "This order was cancelled.",
    stepReceived: "Received",
    stepPreparing: "Preparing",
    stepReady: "Served",
  },
  copyOrder: {
    copy: "Copy order link",
    share: "Share link",
    copyAria: "Copy this order page URL",
    shareAria: "Share order page link",
    noUrl: "Could not read the URL.",
    copied: "Order link copied.",
    copyUnsupported: "Copy is not supported. Copy from the address bar.",
    shareUnsupported: "Sharing is not available on this device.",
    shared: "Shared.",
    shareFailed: "Could not share.",
    shareTitle: "Order",
    shareText: "Order page link",
  },
};

const BY_LOCALE: Record<AppLocale, ErrorsMessageTree> = {
  ko: KO,
  en: EN,
  ja: {
    ...EN,
    progress: { ...EN.progress, stepReceived: "受付", stepPreparing: "調理", stepReady: "提供完了" },
    copyOrder: { ...EN.copyOrder, copy: "注文URLをコピー", share: "共有" },
  },
  "zh-Hans": {
    ...EN,
    progress: { ...EN.progress, stepReceived: "接单", stepPreparing: "制作", stepReady: "已上菜" },
    copyOrder: { ...EN.copyOrder, copy: "复制订单链接", share: "分享" },
  },
  "zh-Hant": {
    ...EN,
    progress: { ...EN.progress, stepReceived: "接單", stepPreparing: "製作", stepReady: "已上菜" },
    copyOrder: { ...EN.copyOrder, copy: "複製訂單連結", share: "分享" },
  },
};

export function errorsMessages(locale: AppLocale): ErrorsMessageTree {
  return BY_LOCALE[locale] ?? EN;
}

export function resolveGuestOrderError(
  code: GuestOrderErrorCode,
  locale: AppLocale,
  params?: GuestOrderErrorParams,
): string {
  const template = errorsMessages(locale).orderErrors[code] ?? EN_ERRORS[code];
  if (params?.max != null) {
    return template.replace("{max}", params.max);
  }
  return template;
}
