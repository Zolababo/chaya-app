import { a11yMessages, type A11yMessageTree } from "./consumer-messages-a11y";
import { errorsMessages, type ErrorsMessageTree } from "./consumer-messages-errors";
import { flowMessages, type FlowMessageTree } from "./consumer-messages-flow";
import type { AppLocale } from "./locales";
import { DEFAULT_LOCALE } from "./locales";

type MessageTree = {
  nav: { menu: string; cart: string; orders: string };
  menu: {
    boardTitle: string;
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
    todaysMenuLabel: string;
    guestNoteToggle: string;
    guestNoteHide: string;
  };
  header: {
    orderMenu: string;
    tableNone: string;
    tableBadge: string;
    languageOpen: string;
    languageDialogTitle: string;
    languageClose: string;
    easyMenu: string;
    easyMenuAria: string;
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
  nav: { menu: "메뉴", cart: "장바구니", orders: "주문" },
  menu: {
    boardTitle: "메뉴판",
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
    todaysMenuLabel: "오늘의 메뉴",
    guestNoteToggle: "요청사항 추가",
    guestNoteHide: "접기",
  },
  header: {
    orderMenu: "주문 메뉴",
    tableNone: "테이블 번호 없음",
    tableBadge: "테이블 {table}",
    languageOpen: "언어 선택",
    languageDialogTitle: "표시 언어",
    languageClose: "닫기",
    easyMenu: "큰글씨·목록",
    easyMenuAria: "큰글씨·목록형 메뉴 화면으로 이동",
    toolbarLabel: "언어 및 쉬운 메뉴",
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
    todaysMenuLabel: "Today's pick",
    guestNoteToggle: "Add a note",
    guestNoteHide: "Hide note",
  },
  header: {
    orderMenu: "Order menu",
    tableNone: "No table number",
    tableBadge: "Table {table}",
    languageOpen: "Choose language",
    languageDialogTitle: "Display language",
    languageClose: "Close",
    easyMenu: "Large text · List",
    easyMenuAria: "Open large-text list menu screen",
    toolbarLabel: "Language and easy menu",
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
    todaysMenuLabel: "本日のおすすめ",
    guestNoteToggle: "リクエストを追加",
    guestNoteHide: "閉じる",
  },
  header: {
    orderMenu: "注文メニュー",
    tableNone: "テーブル番号なし",
    tableBadge: "テーブル {table}",
    languageOpen: "言語を選ぶ",
    languageDialogTitle: "表示言語",
    languageClose: "閉じる",
    easyMenu: "大きい文字・一覧",
    easyMenuAria: "大きい文字の一覧メニュー画面へ",
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
    todaysMenuLabel: EN.menu.todaysMenuLabel,
    guestNoteToggle: EN.menu.guestNoteToggle,
    guestNoteHide: EN.menu.guestNoteHide,
  },
  header: {
    orderMenu: "点餐",
    tableNone: "无桌号",
    tableBadge: "桌号 {table}",
    languageOpen: "选择语言",
    languageDialogTitle: "显示语言",
    languageClose: "关闭",
    easyMenu: "大字·列表",
    easyMenuAria: "前往大字列表菜单",
    toolbarLabel: "语言与简易菜单",
  },
  flow: { step1: "① 选择菜品", step2: "② 确认购物车", step3: "③ 提交厨房" },
};

const ZH_HANT: CoreMessageTree = {
  nav: { menu: "菜單", cart: "購物車", orders: "訂單" },
  menu: {
    boardTitle: "菜單",
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
    todaysMenuLabel: EN.menu.todaysMenuLabel,
    guestNoteToggle: EN.menu.guestNoteToggle,
    guestNoteHide: EN.menu.guestNoteHide,
  },
  header: {
    orderMenu: "點餐",
    tableNone: "無桌號",
    tableBadge: "桌號 {table}",
    languageOpen: "選擇語言",
    languageDialogTitle: "顯示語言",
    languageClose: "關閉",
    easyMenu: "大字·列表",
    easyMenuAria: "前往大字列表菜單",
    toolbarLabel: "語言與簡易菜單",
  },
  flow: { step1: "① 選擇餐點", step2: "② 確認購物車", step3: "③ 送至廚房" },
};

const VI: CoreMessageTree = {
  nav: { menu: "Thực đơn", cart: "Giỏ hàng", orders: "Đơn hàng" },
  menu: {
    boardTitle: "Thực đơn",
    empty: "Chưa có món.",
    listType: "Danh sách món",
    addToCart: "Thêm",
    addedToast: "Đã thêm vào giỏ",
    soldOut: "Hết",
    detailBack: "Về thực đơn",
    categoryFallback: "Món",
    soldOutBanner: "Đã hết món.",
    soldOutCart: "Món đã hết. Vui lòng chọn món khác.",
    quantity: "Số lượng",
    decreaseQty: "Giảm số lượng",
    increaseQty: "Tăng số lượng",
    addToCartBar: "Thêm vào giỏ",
    guestNote: "Ghi chú (tùy chọn)",
    guestNotePlaceholder: "VD: ít cay",
    categoryNav: "Danh mục",
    categoryAll: "Tất cả",
    categoryEmpty: "Không có món trong danh mục này.",
    optionRequired: "(bắt buộc)",
    todaysMenuLabel: EN.menu.todaysMenuLabel,
    guestNoteToggle: EN.menu.guestNoteToggle,
    guestNoteHide: EN.menu.guestNoteHide,
  },
  header: {
    ...EN.header,
    orderMenu: "Đặt món",
    tableNone: "Không có số bàn",
    tableBadge: "Bàn {table}",
    easyMenu: "Chữ lớn · Danh sách",
    easyMenuAria: "Mở màn hình menu dạng danh sách chữ lớn",
  },
  flow: {
    step1: "① Chọn món",
    step2: "② Xem giỏ",
    step3: "③ Gửi bếp",
  },
};

const TH: CoreMessageTree = {
  nav: { menu: "เมนู", cart: "ตะกร้า", orders: "คำสั่งซื้อ" },
  menu: {
    boardTitle: "เมนู",
    empty: "ไม่มีรายการเมนู",
    listType: "เมนูแบบรายการ",
    addToCart: "เพิ่ม",
    addedToast: "เพิ่มในตะกร้าแล้ว",
    soldOut: "หมด",
    detailBack: "กลับไปเมนู",
    categoryFallback: "เมนู",
    soldOutBanner: "สินค้าหมดชั่วคราว",
    soldOutCart: "หมดแล้ว กรุณาเลือกเมนูอื่น",
    quantity: "จำนวน",
    decreaseQty: "ลดจำนวน",
    increaseQty: "เพิ่มจำนวน",
    addToCartBar: "ใส่ตะกร้า",
    guestNote: "หมายเหตุ (ไม่บังคับ)",
    guestNotePlaceholder: "เช่น ไม่เผ็ด",
    categoryNav: "หมวดหมู่",
    categoryAll: "ทั้งหมด",
    categoryEmpty: "ไม่มีเมนูในหมวดนี้",
    optionRequired: "(จำเป็น)",
    todaysMenuLabel: EN.menu.todaysMenuLabel,
    guestNoteToggle: EN.menu.guestNoteToggle,
    guestNoteHide: EN.menu.guestNoteHide,
  },
  header: {
    ...EN.header,
    orderMenu: "สั่งอาหาร",
    tableNone: "ไม่มีเลขโต๊ะ",
    tableBadge: "โต๊ะ {table}",
    easyMenu: "ตัวใหญ่ · รายการ",
    easyMenuAria: "ไปหน้าเมนูแบบรายการตัวใหญ่",
  },
  flow: {
    step1: "① เลือกเมนู",
    step2: "② ตรวจตะกร้า",
    step3: "③ ส่งครัว",
  },
};

const RU: CoreMessageTree = {
  nav: { menu: "Меню", cart: "Корзина", orders: "Заказы" },
  menu: {
    boardTitle: "Меню",
    empty: "Нет блюд для отображения.",
    listType: "Список меню",
    addToCart: "В корзину",
    addedToast: "Добавлено в корзину",
    soldOut: "Нет в наличии",
    detailBack: "К меню",
    categoryFallback: "Блюдо",
    soldOutBanner: "Сейчас нет в наличии.",
    soldOutCart: "Нет в наличии. Выберите другое блюдо.",
    quantity: "Количество",
    decreaseQty: "Уменьшить",
    increaseQty: "Увеличить",
    addToCartBar: "В корзину",
    guestNote: "Пожелания (необяз.)",
    guestNotePlaceholder: "напр. не остро",
    categoryNav: "Категории",
    categoryAll: "Все",
    categoryEmpty: "В этой категории нет блюд.",
    optionRequired: "(обяз.)",
    todaysMenuLabel: EN.menu.todaysMenuLabel,
    guestNoteToggle: EN.menu.guestNoteToggle,
    guestNoteHide: EN.menu.guestNoteHide,
  },
  header: {
    ...EN.header,
    orderMenu: "Меню заказа",
    tableNone: "Нет номера стола",
    tableBadge: "Стол {table}",
    easyMenu: "Крупный текст · Список",
    easyMenuAria: "Открыть меню крупным списком",
  },
  flow: {
    step1: "① Выберите блюда",
    step2: "② Проверьте корзину",
    step3: "③ Отправить на кухню",
  },
};

const MESSAGES: Record<AppLocale, CoreMessageTree> = {
  ko: KO,
  en: EN,
  ja: JA,
  "zh-Hans": ZH_HANS,
  "zh-Hant": ZH_HANT,
  vi: VI,
  th: TH,
  ru: RU,
};

export function consumerMessages(locale: AppLocale): MessageTree {
  const base = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  const menu = {
    ...base.menu,
    todaysMenuLabel: base.menu.todaysMenuLabel ?? EN.menu.todaysMenuLabel,
    guestNoteToggle: base.menu.guestNoteToggle ?? EN.menu.guestNoteToggle,
    guestNoteHide: base.menu.guestNoteHide ?? EN.menu.guestNoteHide,
  };
  return { ...base, menu, ...flowMessages(locale), ...a11yMessages(locale), ...errorsMessages(locale) };
}
