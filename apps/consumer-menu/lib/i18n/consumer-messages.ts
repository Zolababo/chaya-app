import { a11yMessages, type A11yMessageTree } from "./consumer-messages-a11y";
import { errorsMessages, type ErrorsMessageTree } from "./consumer-messages-errors";
import { flowMessages, type FlowMessageTree } from "./consumer-messages-flow";
import type { AppLocale } from "./locales";
import { DEFAULT_LOCALE } from "./locales";

type MessageTree = {
  nav: { menu: string; cart: string; orders: string };
  menu: {
    boardTitle: string;
    loading: string;
    empty: string;
    listType: string;
    addToCart: string;
    addedToast: string;
    soldOut: string;
    detailBack: string;
    categoryFallback: string;
    soldOutBanner: string;
    soldOutCart: string;
    quantity: string;
    decreaseQty: string;
    increaseQty: string;
    addToCartBar: string;
    guestNote: string;
    guestNotePlaceholder: string;
    categoryNav: string;
    categoryAll: string;
    categoryEmpty: string;
    optionRequired: string;
    noOptionsHint: string;
    detailSheetClose: string;
    todaysMenuLabel: string;
    recentPopularLabel: string;
    storeRecommendedLabel: string;
    badgeFeatured: string;
    badgePopular: string;
    badgeNew: string;
    guestNoteToggle: string;
    guestNoteHide: string;
    spiceLevelAria: string;
  };
  header: {
    orderMenu: string;
    tableNone: string;
    tableBadge: string;
    invalidTableQr: string;
    tableLockedHint: string;
    languageOpen: string;
    languageDialogTitle: string;
    languageClose: string;
    easyMenu: string;
    easyMenuAria: string;
    easyMenuOff: string;
    easyMenuOffAria: string;
    toolbarLabel: string;
  };
  flow: { step1: string; step2: string; step3: string };
} & FlowMessageTree &
  A11yMessageTree &
  ErrorsMessageTree;

type CoreMessageTree = Omit<
  MessageTree,
  keyof FlowMessageTree | keyof A11yMessageTree | keyof ErrorsMessageTree
>;

const KO: CoreMessageTree = {
  nav: { menu: "메뉴", cart: "장바구니", orders: "주문내역" },
  menu: {
    boardTitle: "메뉴판",
    loading: "메뉴 불러오는 중…",
    empty: "표시할 메뉴가 없습니다.",
    listType: "목록형 메뉴",
    addToCart: "담기",
    addedToast: "장바구니에 담았어요",
    soldOut: "품절",
    detailBack: "메뉴판으로 돌아가기",
    categoryFallback: "메뉴",
    soldOutBanner: "현재 품절입니다.",
    soldOutCart: "지금은 품절입니다. 다른 메뉴를 둘러봐 주세요.",
    quantity: "수량",
    decreaseQty: "수량 한 개 줄이기",
    increaseQty: "수량 한 개 늘리기",
    addToCartBar: "장바구니에 담기",
    guestNote: "요청사항 (선택)",
    guestNotePlaceholder: "예: 덜 맵게, 양파 빼기",
    categoryNav: "카테고리",
    categoryAll: "전체",
    categoryEmpty: "이 카테고리에 표시할 메뉴가 없습니다.",
    optionRequired: "(필수)",
    noOptionsHint: "이 메뉴는 선택 옵션이 없어요",
    detailSheetClose: "메뉴 상세 닫기",
    todaysMenuLabel: "오늘의 메뉴",
    recentPopularLabel: "요즘 뜨는",
    storeRecommendedLabel: "사장님 Pick",
    badgeFeatured: "대표",
    badgePopular: "인기",
    badgeNew: "신규",
    guestNoteToggle: "요청사항 추가",
    guestNoteHide: "접기",
    spiceLevelAria: "매운맛 {level}단계",
  },
  header: {
    orderMenu: "주문 메뉴",
    tableNone: "테이블 번호 없음",
    tableBadge: "테이블 {table}",
    invalidTableQr:
      "등록되지 않은 테이블 QR입니다. 테이블에 붙은 QR을 다시 스캔하거나 아래에서 테이블을 선택해 주세요.",
    tableLockedHint: "QR로 지정된 테이블입니다. 번호를 바꿀 수 없습니다.",
    languageOpen: "언어 선택",
    languageDialogTitle: "표시 언어",
    languageClose: "닫기",
    easyMenu: "큰글씨·목록",
    easyMenuAria: "읽기 쉬운·목록형 메뉴 켜기. 큰 글씨 목록 화면으로 열립니다",
    easyMenuOff: "일반 보기",
    easyMenuOffAria: "읽기 쉬운·목록형 메뉴 끄기. 지금 화면을 유지합니다",
    toolbarLabel: "언어 및 읽기 쉬운 메뉴",
  },
  flow: {
    step1: "① 메뉴 고르기",
    step2: "② 장바구니 확인",
    step3: "③ 주방으로 주문",
  },
};

const EN: CoreMessageTree = {
  nav: { menu: "Menu", cart: "Cart", orders: "Orders" },
  menu: {
    boardTitle: "Menu",
    loading: "Loading menu…",
    empty: "No menu items to show.",
    listType: "List menu",
    addToCart: "Add",
    addedToast: "Added to cart",
    soldOut: "Sold out",
    detailBack: "Back to menu",
    categoryFallback: "Menu",
    soldOutBanner: "Currently sold out.",
    soldOutCart: "Sold out. Please choose another item.",
    quantity: "Quantity",
    decreaseQty: "Decrease quantity",
    increaseQty: "Increase quantity",
    addToCartBar: "Add to cart",
    guestNote: "Special requests (optional)",
    guestNotePlaceholder: "e.g. less spicy, no onions",
    categoryNav: "Categories",
    categoryAll: "All",
    categoryEmpty: "No items in this category.",
    optionRequired: "(required)",
    noOptionsHint: "No options for this item",
    detailSheetClose: "Close menu details",
    todaysMenuLabel: "Today's pick",
    recentPopularLabel: "Trending",
    storeRecommendedLabel: "Owner's pick",
    badgeFeatured: "Pick",
    badgePopular: "Hot",
    badgeNew: "New",
    guestNoteToggle: "Add a note",
    guestNoteHide: "Hide note",
    spiceLevelAria: "Spicy level {level}",
  },
  header: {
    orderMenu: "Order menu",
    tableNone: "No table number",
    tableBadge: "Table {table}",
    invalidTableQr:
      "This table QR is not registered. Scan the QR on your table or select your table below.",
    tableLockedHint: "Table set by QR. You cannot change the number.",
    languageOpen: "Choose language",
    languageDialogTitle: "Display language",
    languageClose: "Close",
    easyMenu: "Large text · List",
    easyMenuAria: "Turn on easy-to-read list menu. Opens large-text list view from the menu screen",
    easyMenuOff: "Standard view",
    easyMenuOffAria: "Turn off easy-to-read list menu and stay on this screen",
    toolbarLabel: "Language and easy-read menu",
  },
  flow: {
    step1: "① Choose items",
    step2: "② Review cart",
    step3: "③ Send to kitchen",
  },
};

const JA: CoreMessageTree = {
  nav: { menu: "メニュー", cart: "カート", orders: "注文" },
  menu: {
    boardTitle: "メニュー",
    loading: "メニューを読み込み中…",
    empty: "表示するメニューがありません。",
    listType: "リストメニュー",
    addToCart: "追加",
    addedToast: "カートに入れました",
    soldOut: "品切れ",
    detailBack: "メニューに戻る",
    categoryFallback: "メニュー",
    soldOutBanner: "現在品切れです。",
    soldOutCart: "品切れです。他のメニューをご覧ください。",
    quantity: "数量",
    decreaseQty: "数量を減らす",
    increaseQty: "数量を増やす",
    addToCartBar: "カートに入れる",
    guestNote: "リクエスト（任意）",
    guestNotePlaceholder: "例：辛さ控えめ",
    categoryNav: "カテゴリー",
    categoryAll: "すべて",
    categoryEmpty: "このカテゴリーにメニューはありません。",
    optionRequired: "（必須）",
    noOptionsHint: "選択オプションはありません",
    detailSheetClose: "詳細を閉じる",
    todaysMenuLabel: "本日のおすすめ",
    recentPopularLabel: "今人気",
    storeRecommendedLabel: "店長Pick",
    badgeFeatured: "おすすめ",
    badgePopular: "人気",
    badgeNew: "新着",
    guestNoteToggle: "リクエストを追加",
    guestNoteHide: "閉じる",
    spiceLevelAria: "辛さ {level}",
  },
  header: {
    orderMenu: "注文メニュー",
    tableNone: "テーブル番号なし",
    tableBadge: "テーブル {table}",
    invalidTableQr:
      "登録されていないテーブルQRです。テーブルのQRを再度読み取るか、下からテーブルを選んでください。",
    tableLockedHint: "QRで指定されたテーブルです。番号は変更できません。",
    languageOpen: "言語を選ぶ",
    languageDialogTitle: "表示言語",
    languageClose: "閉じる",
    easyMenu: "大きい文字・一覧",
    easyMenuAria: "大きい文字の一覧表示をオン。メニュー画面では一覧型で開きます",
    easyMenuOff: "通常の文字",
    easyMenuOffAria: "大きい文字の一覧表示をオフ。今の画面のまま",
    toolbarLabel: "言語と見やすいメニュー",
  },
  flow: {
    step1: "① メニューを選ぶ",
    step2: "② カートを確認",
    step3: "③ キッチンへ送信",
  },
};

const ZH_HANS: CoreMessageTree = {
  nav: { menu: "菜单", cart: "购物车", orders: "订单" },
  menu: {
    boardTitle: "菜单",
    loading: "正在加载菜单…",
    empty: "暂无菜品。",
    listType: "列表菜单",
    addToCart: "加入",
    addedToast: "已加入购物车",
    soldOut: "售罄",
    detailBack: "返回菜单",
    categoryFallback: "菜品",
    soldOutBanner: "目前已售罄。",
    soldOutCart: "已售罄，请选择其他菜品。",
    quantity: "数量",
    decreaseQty: "减少数量",
    increaseQty: "增加数量",
    addToCartBar: "加入购物车",
    guestNote: "备注（可选）",
    guestNotePlaceholder: "例如：少辣",
    categoryNav: "分类",
    categoryAll: "全部",
    categoryEmpty: "该分类下暂无菜品。",
    optionRequired: "（必选）",
    noOptionsHint: "此菜品无可选规格",
    detailSheetClose: "关闭详情",
    todaysMenuLabel: "今日推荐",
    recentPopularLabel: "当下热门",
    storeRecommendedLabel: "店长 Pick",
    badgeFeatured: "招牌",
    badgePopular: "人气",
    badgeNew: "新品",
    guestNoteToggle: EN.menu.guestNoteToggle,
    guestNoteHide: EN.menu.guestNoteHide,
    spiceLevelAria: "辣度 {level}",
  },
  header: {
    orderMenu: "点餐",
    tableNone: "无桌号",
    tableBadge: "桌号 {table}",
    invalidTableQr: EN.header.invalidTableQr,
    tableLockedHint: EN.header.tableLockedHint,
    languageOpen: "选择语言",
    languageDialogTitle: "显示语言",
    languageClose: "关闭",
    easyMenu: "大字·列表",
    easyMenuAria: "开启大字列表视图。在菜单页打开列表型菜单",
    easyMenuOff: "普通字号",
    easyMenuOffAria: "关闭大字列表视图，留在当前页面",
    toolbarLabel: "语言与简易菜单",
  },
  flow: { step1: "① 选择菜品", step2: "② 确认购物车", step3: "③ 提交厨房" },
};

const ZH_HANT: CoreMessageTree = {
  nav: { menu: "菜單", cart: "購物車", orders: "訂單" },
  menu: {
    boardTitle: "菜單",
    loading: "正在載入菜單…",
    empty: "暫無餐點。",
    listType: "列表菜單",
    addToCart: "加入",
    addedToast: "已加入購物車",
    soldOut: "售完",
    detailBack: "返回菜單",
    categoryFallback: "餐點",
    soldOutBanner: "目前已售完。",
    soldOutCart: "已售完，請選擇其他餐點。",
    quantity: "數量",
    decreaseQty: "減少數量",
    increaseQty: "增加數量",
    addToCartBar: "加入購物車",
    guestNote: "備註（選填）",
    guestNotePlaceholder: "例如：少辣",
    categoryNav: "分類",
    categoryAll: "全部",
    categoryEmpty: "此分類暫無餐點。",
    optionRequired: "（必選）",
    noOptionsHint: "此菜品無可選規格",
    detailSheetClose: "關閉詳情",
    todaysMenuLabel: EN.menu.todaysMenuLabel,
    recentPopularLabel: EN.menu.recentPopularLabel,
    storeRecommendedLabel: "店長 Pick",
    badgeFeatured: "招牌",
    badgePopular: "人氣",
    badgeNew: "新品",
    guestNoteToggle: EN.menu.guestNoteToggle,
    guestNoteHide: EN.menu.guestNoteHide,
    spiceLevelAria: "辣度 {level}",
  },
  header: {
    orderMenu: "點餐",
    tableNone: "無桌號",
    tableBadge: "桌號 {table}",
    invalidTableQr: EN.header.invalidTableQr,
    tableLockedHint: EN.header.tableLockedHint,
    languageOpen: "選擇語言",
    languageDialogTitle: "顯示語言",
    languageClose: "關閉",
    easyMenu: "大字·列表",
    easyMenuAria: "開啟大字列表檢視。在菜單頁開啟列表型菜單",
    easyMenuOff: "一般字級",
    easyMenuOffAria: "關閉大字列表檢視，留在目前頁面",
    toolbarLabel: "語言與簡易菜單",
  },
  flow: { step1: "① 選擇餐點", step2: "② 確認購物車", step3: "③ 送至廚房" },
};

const MESSAGES: Record<AppLocale, CoreMessageTree> = {
  ko: KO,
  en: EN,
  ja: JA,
  "zh-Hans": ZH_HANS,
  "zh-Hant": ZH_HANT,
};

export function consumerMessages(locale: AppLocale): MessageTree {
  const base = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  const menu = {
    ...base.menu,
    todaysMenuLabel: base.menu.todaysMenuLabel ?? EN.menu.todaysMenuLabel,
    recentPopularLabel: base.menu.recentPopularLabel ?? EN.menu.recentPopularLabel,
    storeRecommendedLabel: base.menu.storeRecommendedLabel ?? EN.menu.storeRecommendedLabel,
    badgeFeatured: base.menu.badgeFeatured ?? EN.menu.badgeFeatured,
    badgePopular: base.menu.badgePopular ?? EN.menu.badgePopular,
    badgeNew: base.menu.badgeNew ?? EN.menu.badgeNew,
    guestNoteToggle: base.menu.guestNoteToggle ?? EN.menu.guestNoteToggle,
    guestNoteHide: base.menu.guestNoteHide ?? EN.menu.guestNoteHide,
    noOptionsHint: base.menu.noOptionsHint ?? EN.menu.noOptionsHint,
    detailSheetClose: base.menu.detailSheetClose ?? EN.menu.detailSheetClose,
    spiceLevelAria: base.menu.spiceLevelAria ?? EN.menu.spiceLevelAria,
  };
  const header = {
    ...base.header,
    invalidTableQr: base.header.invalidTableQr ?? EN.header.invalidTableQr,
    tableLockedHint: base.header.tableLockedHint ?? EN.header.tableLockedHint,
    easyMenuOff: base.header.easyMenuOff ?? EN.header.easyMenuOff,
    easyMenuOffAria: base.header.easyMenuOffAria ?? EN.header.easyMenuOffAria,
  };
  return { ...base, menu, header, ...flowMessages(locale), ...a11yMessages(locale), ...errorsMessages(locale) };
}
