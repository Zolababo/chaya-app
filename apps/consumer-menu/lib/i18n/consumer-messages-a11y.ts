import type { AppLocale } from "./locales";

export type A11yMessageTree = {
  barrierFree: {
    pageTitle: string;
    pageIntro: string;
    categoryNav: string;
    categoryEmpty: string;
    categoryChanged: string;
    menuList: string;
    soldOut: string;
    add: string;
    detailLink: string;
    detailAria: string;
    navNext: string;
    toGridMenu: string;
    toGridAria: string;
    toCart: string;
    toCartAria: string;
    toCartWithCount: string;
    toOrders: string;
    toOrdersAria: string;
    cartSummary: string;
    statusLabel: string;
    ready: string;
    addedOne: string;
    dataFail: string;
    dataDemo: string;
    dataDb: string;
  };
  orderLive: {
    statusSr: string;
    refreshPending: string;
    refresh: string;
    refreshAriaPending: string;
    refreshAria: string;
    fullRefresh: string;
    fullRefreshAria: string;
    pollOff: string;
    pollOn: string;
  };
};

const KO: A11yMessageTree = {
  barrierFree: {
    pageTitle: "목록형 메뉴",
    pageIntro:
      "TalkBack·VoiceOver 등으로 읽기 쉬운 보조 화면입니다. 담기는 기본 메뉴판·장바구니와 같은 저장소를 씁니다.",
    categoryNav: "카테고리 선택",
    categoryEmpty: "선택한 카테고리에 메뉴가 없습니다.",
    categoryChanged: "카테고리가 {category}(으)로 바뀌었습니다.",
    menuList: "메뉴 목록",
    soldOut: "품절",
    add: "담기",
    detailLink: "상세·수량 선택",
    detailAria: "{name} 상세 화면에서 수량 선택",
    navNext: "다음 동작",
    toGridMenu: "기본 메뉴로",
    toGridAria: "그리드형 기본 메뉴판으로",
    toCart: "장바구니 확인",
    toCartAria: "장바구니로 이동",
    toCartWithCount: "장바구니 확인 ({count}개)",
    toOrders: "주문 현황",
    toOrdersAria: "주문 현황 목록으로",
    cartSummary: "이 브라우저에 저장된 수량 합계: {count}개 (메뉴판·목록형·상세가 공유합니다)",
    statusLabel: "상태 알림",
    ready: "준비되었습니다.",
    addedOne: "{name} 1개를 같은 장바구니에 담았습니다.",
    dataFail: "연결 실패로 데모 목록 사용 중",
    dataDemo: "로컬 데모",
    dataDb: "Supabase ChayaMenus",
  },
  orderLive: {
    statusSr: "현재 주문 상태.",
    refreshPending: "불러오는 중…",
    refresh: "최신 상태로",
    refreshAriaPending: "주문 상태 불러오는 중",
    refreshAria: "주문 상태를 서버에서 다시 받아오기",
    fullRefresh: "품목·금액까지 전체 새로고침",
    fullRefreshAria: "주문 품목과 금액까지 페이지 전체 새로고침",
    pollOff: "자동 갱신은 꺼져 있습니다. 위 버튼으로 확인해 주세요.",
    pollOn: "약 {seconds}초마다 상태만 자동으로 다시 불러옵니다.",
  },
};

const EN: A11yMessageTree = {
  barrierFree: {
    pageTitle: "List menu",
    pageIntro: "Easier screen for TalkBack and VoiceOver. Cart is shared with the main menu.",
    categoryNav: "Categories",
    categoryEmpty: "No items in this category.",
    categoryChanged: "Category changed to {category}.",
    menuList: "Menu list",
    soldOut: "Sold out",
    add: "Add",
    detailLink: "Details & quantity",
    detailAria: "{name} open detail to choose quantity",
    navNext: "Next steps",
    toGridMenu: "Main menu",
    toGridAria: "Go to grid menu",
    toCart: "View cart",
    toCartAria: "Go to cart",
    toCartWithCount: "View cart ({count})",
    toOrders: "Orders",
    toOrdersAria: "Go to order list",
    cartSummary: "Items in this browser: {count} (shared across menu views)",
    statusLabel: "Status",
    ready: "Ready.",
    addedOne: "Added 1 × {name} to cart.",
    dataFail: "Using demo list (connection failed)",
    dataDemo: "Local demo",
    dataDb: "Supabase ChayaMenus",
  },
  orderLive: {
    statusSr: "Current order status.",
    refreshPending: "Loading…",
    refresh: "Refresh status",
    refreshAriaPending: "Loading order status",
    refreshAria: "Fetch latest status from server",
    fullRefresh: "Reload full page",
    fullRefreshAria: "Reload page including items and total",
    pollOff: "Auto-refresh is off. Use the button above.",
    pollOn: "Status refreshes about every {seconds} seconds.",
  },
};

const JA: A11yMessageTree = {
  ...EN,
  barrierFree: {
    ...EN.barrierFree,
    pageTitle: "リストメニュー",
    pageIntro: "TalkBack・VoiceOver向けの補助画面です。カートは通常メニューと共有されます。",
    categoryNav: "カテゴリー",
    add: "追加",
    toCart: "カートを見る",
    toOrders: "注文状況",
    toGridMenu: "通常メニューへ",
  },
  orderLive: {
    ...EN.orderLive,
    refresh: "最新状態",
    refreshPending: "読み込み中…",
  },
};

const ZH_HANS: A11yMessageTree = {
  ...EN,
  barrierFree: {
    ...EN.barrierFree,
    pageTitle: "列表菜单",
    pageIntro: "便于读屏的辅助界面，购物车与主菜单共用。",
    categoryNav: "分类",
    add: "加入",
    toCart: "查看购物车",
    toOrders: "订单状态",
    toGridMenu: "返回主菜单",
  },
  orderLive: { ...EN.orderLive, refresh: "刷新状态", refreshPending: "加载中…" },
};

const BY_LOCALE: Record<AppLocale, A11yMessageTree> = {
  ko: KO,
  en: EN,
  ja: JA,
  "zh-Hans": ZH_HANS,
  "zh-Hant": { ...ZH_HANS, barrierFree: { ...ZH_HANS.barrierFree, pageTitle: "列表菜單", toGridMenu: "返回主菜單" } },
  vi: EN,
  th: EN,
  ru: EN,
};

export function a11yMessages(locale: AppLocale): A11yMessageTree {
  return BY_LOCALE[locale] ?? EN;
}
