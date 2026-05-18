import type { AppLocale } from "./locales";

export type FlowMessageTree = {
  cart: {
    pageTitle: string;
    pageIntro: string;
    loading: string;
    empty: string;
    emptyCta: string;
    emptyCtaAria: string;
    listLabel: string;
    lineTotal: string;
    unitPrice: string;
    multiply: string;
    each: string;
    remove: string;
    total: string;
    tableLabel: string;
    optional: string;
    tablePlaceholder: string;
    noteLabel: string;
    notePlaceholder: string;
    noteCount: string;
    submitHint: string;
    submitPending: string;
    submit: string;
    submitAriaPending: string;
    storageNote: string;
    qtySr: string;
    removeAria: string;
    addMoreMenu: string;
    addMoreMenuAria: string;
  };
  splitBill: {
    title: string;
    hint: string;
    peopleLabel: string;
    perPerson: string;
    decreasePeople: string;
    increasePeople: string;
  };
  orders: {
    pageTitle: string;
    pageIntro: string;
    loading: string;
    preparing: string;
    hubLabel: string;
    retry: string;
    pollNote: string;
    noSession: string;
    empty: string;
    accountHeading: string;
    guestHeading: string;
    accountListLabel: string;
    guestListLabel: string;
    toMenu: string;
    toMenuAria: string;
    toCart: string;
    toCartAria: string;
    toBarrierFree: string;
    toBarrierFreeAria: string;
    loadErrorNoClient: string;
    loadErrorRpc: string;
    accountRpcError: string;
    accountEmpty: string;
    loginLead: string;
    login: string;
    signup: string;
    loginTail: string;
    claimed: string;
    orderLinkAria: string;
  };
  payment: { offlineLead: string; offlineRest: string };
  status: {
    pending: string;
    accepted: string;
    preparing: string;
    ready: string;
    completed: string;
    cancelled: string;
  };
  orderDetail: {
    notFoundTitle: string;
    notFoundBody: string;
    notFoundRpc: string;
    toCart: string;
    toCartAria: string;
    receivedSr: string;
    receivedTitle: string;
    orderNo: string;
    revisitHint: string;
    tableLabel: string;
    requestLabel: string;
    linesHeading: string;
    total: string;
    toOrders: string;
    toOrdersAria: string;
    toMenu: string;
    toMenuAria: string;
    metaLabel: string;
  };
};

const KO: FlowMessageTree = {
  cart: {
    pageTitle: "장바구니",
    pageIntro: "",
    loading: "불러오는 중…",
    empty: "담은 메뉴가 없어요",
    emptyCta: "메뉴 담으러 가기",
    emptyCtaAria: "메뉴판으로 이동",
    listLabel: "담은 메뉴",
    lineTotal: "",
    unitPrice: "",
    multiply: "×",
    each: "개",
    remove: "삭제",
    total: "결제 예정 금액",
    tableLabel: "테이블",
    optional: "",
    tablePlaceholder: "테이블 번호 (선택)",
    noteLabel: "요청사항",
    notePlaceholder: "덜 맵게, 양파 빼기 등 (선택)",
    noteCount: "{count}/500",
    submitHint: "주문 후 하단 주문 탭에서 진행 상황을 확인할 수 있어요",
    submitPending: "주문하는 중…",
    submit: "주문하기",
    submitAriaPending: "주문 처리 중",
    storageNote: "",
    qtySr: "수량",
    removeAria: "삭제",
    addMoreMenu: "메뉴 더 담기",
    addMoreMenuAria: "메뉴판으로 이동해 메뉴 추가",
  },
  splitBill: {
    title: "더치페이",
    hint: "인원수를 나눠 1인당 금액을 참고하세요",
    peopleLabel: "인원",
    perPerson: "1인당 약 {amount}",
    decreasePeople: "인원 한 명 줄이기",
    increasePeople: "인원 한 명 늘리기",
  },
  orders: {
    pageTitle: "주문 현황",
    pageIntro:
      "비회원 주문은 이 브라우저·이 폰에서 보낸 것만 보입니다. 로그인하면 계정에 연결된 주문도 함께 볼 수 있습니다.",
    loading: "주문 내역 불러오는 중…",
    preparing: "준비 중…",
    hubLabel: "주문 목록과 안내",
    retry: "목록 다시 불러오기",
    pollNote:
      "약 {seconds}초마다 목록 상태를 다시 불러옵니다. 접근성 설정에서 동작 줄이기를 켜 두면 자동 갱신은 꺼집니다.",
    noSession:
      "주문 목록은 주문할 때 쓴 같은 폰·같은 브라우저에서 열어야 이어집니다. 이 브라우저에는 비회원 주문 세션이 없습니다. 장바구니에서 주문을 내면 여기에 쌓입니다.",
    empty:
      "아직 이 가게에서 주문한 기록이 없습니다. 주문 확인은 이 폰·이 브라우저에서 열어 주세요.",
    accountHeading: "내 계정 주문",
    guestHeading: "이 브라우저 비회원 주문",
    accountListLabel: "로그인 계정 주문 목록",
    guestListLabel: "이 가게 비회원 주문 목록",
    toMenu: "메뉴로",
    toMenuAria: "메뉴판으로",
    toCart: "장바구니",
    toCartAria: "장바구니로",
    toBarrierFree: "목록형 메뉴",
    toBarrierFreeAria: "목록형 메뉴로. 같은 장바구니와 연결됩니다.",
    loadErrorNoClient: "Supabase 환경 변수가 없어 목록을 불러올 수 없습니다.",
    loadErrorRpc: "목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.",
    accountRpcError: "계정 주문 목록을 불러오지 못했습니다.",
    accountEmpty:
      "아직 이 가게에서 계정에 연결된 주문이 없습니다. 이 브라우저에서 주문한 비회원 주문이 자동으로 연결됩니다.",
    loginLead: "",
    login: "로그인",
    signup: "회원가입",
    loginTail: "으로 이 폰의 비회원 주문을 계정에 묶을 수 있습니다.",
    claimed: "비회원 주문 {count}건을 계정에 연결했습니다.",
    orderLinkAria: "상세 페이지로 이동",
  },
  payment: {
    offlineLead: "매장에서 결제",
    offlineRest: "",
  },
  status: {
    pending: "접수됨",
    accepted: "주문 확인",
    preparing: "조리 중",
    ready: "픽업·서빙 준비",
    completed: "완료",
    cancelled: "취소됨",
  },
  orderDetail: {
    notFoundTitle: "주문을 찾을 수 없습니다",
    notFoundBody:
      "주문 확인은 주문할 때 쓴 같은 폰·같은 브라우저에서 여는 것이 가장 안전합니다.",
    notFoundRpc: "주문 번호와 가게 경로가 맞는지 확인해 주세요.",
    toCart: "장바구니로",
    toCartAria: "장바구니로 이동",
    receivedSr: "주문 접수 완료",
    receivedTitle: "주문이 접수되었습니다",
    orderNo: "주문 번호",
    revisitHint: "나중에 이 화면을 다시 보려면 이 폰·이 브라우저에서 하단 「주문 현황」을 사용해 주세요.",
    tableLabel: "테이블",
    requestLabel: "요청",
    linesHeading: "주문 내역",
    total: "합계",
    toOrders: "주문 목록",
    toOrdersAria: "주문 목록으로",
    toMenu: "메뉴로 돌아가기",
    toMenuAria: "메뉴판으로 돌아가기",
    metaLabel: "테이블 번호와 요청 사항",
  },
};

const EN: FlowMessageTree = {
  cart: {
    pageTitle: "Cart",
    pageIntro: "",
    loading: "Loading…",
    empty: "Your cart is empty",
    emptyCta: "Browse menu",
    emptyCtaAria: "Go to menu",
    listLabel: "Cart items",
    lineTotal: "",
    unitPrice: "",
    multiply: "×",
    each: "",
    remove: "Remove",
    total: "Total",
    tableLabel: "Table",
    optional: "",
    tablePlaceholder: "Table number (optional)",
    noteLabel: "Note",
    notePlaceholder: "e.g. less spicy (optional)",
    noteCount: "{count}/500",
    submitHint: "Track your order from the Orders tab after checkout",
    submitPending: "Placing order…",
    submit: "Place order",
    submitAriaPending: "Placing order",
    storageNote: "",
    qtySr: "Quantity",
    removeAria: "Remove",
    addMoreMenu: "Add more items",
    addMoreMenuAria: "Go to menu to add items",
  },
  splitBill: {
    title: "Split bill",
    hint: "Divide by number of people for a per-person estimate",
    peopleLabel: "People",
    perPerson: "About {amount} each",
    decreasePeople: "Decrease people",
    increasePeople: "Increase people",
  },
  orders: {
    pageTitle: "Orders",
    pageIntro: "Guest orders appear only on this browser. Sign in to see account-linked orders too.",
    loading: "Loading orders…",
    preparing: "Preparing…",
    hubLabel: "Orders and tips",
    retry: "Reload list",
    pollNote: "List refreshes about every {seconds} seconds. Reduced motion turns auto-refresh off.",
    noSession:
      "Open orders on the same phone and browser you used to order. No guest session here yet—place an order from the cart.",
    empty: "No orders at this store yet. Open order links on this phone and browser.",
    accountHeading: "Account orders",
    guestHeading: "Guest orders (this browser)",
    accountListLabel: "Account order list",
    guestListLabel: "Guest order list",
    toMenu: "Menu",
    toMenuAria: "Go to menu",
    toCart: "Cart",
    toCartAria: "Go to cart",
    toBarrierFree: "List menu",
    toBarrierFreeAria: "List menu view, same cart",
    loadErrorNoClient: "Cannot load list: Supabase env missing.",
    loadErrorRpc: "Could not load list. Try again shortly.",
    accountRpcError: "Could not load account orders.",
    accountEmpty: "No account-linked orders at this store yet.",
    loginLead: "",
    login: "Sign in",
    signup: "Sign up",
    loginTail: " to link guest orders on this phone to your account.",
    claimed: "Linked {count} guest order(s) to your account.",
    orderLinkAria: "Open order details",
  },
  payment: {
    offlineLead: "Pay in store",
    offlineRest: "",
  },
  status: {
    pending: "Received",
    accepted: "Confirmed",
    preparing: "Preparing",
    ready: "Ready",
    completed: "Done",
    cancelled: "Cancelled",
  },
  orderDetail: {
    notFoundTitle: "Order not found",
    notFoundBody: "Open the order on the same phone and browser you used to order.",
    notFoundRpc: "Check the order id and store URL.",
    toCart: "Cart",
    toCartAria: "Go to cart",
    receivedSr: "Order received",
    receivedTitle: "Order received",
    orderNo: "Order",
    revisitHint: "To see this again, use Orders at the bottom on this phone and browser.",
    tableLabel: "Table",
    requestLabel: "Note",
    linesHeading: "Items",
    total: "Total",
    toOrders: "All orders",
    toOrdersAria: "Order list",
    toMenu: "Back to menu",
    toMenuAria: "Back to menu",
    metaLabel: "Table and requests",
  },
};

const JA: FlowMessageTree = {
  cart: {
    pageTitle: "注文確認",
    pageIntro: "カートはこのブラウザにのみ保存されます。注文後はここで確認し、お支払いはレジでお願いします。",
    loading: "カートを読み込み中…",
    empty: "カートは空です。メニューまたは詳細から追加してください。",
    emptyCta: "メニューに戻る",
    emptyCtaAria: "メニューに戻る",
    listLabel: "カートの品目",
    lineTotal: "小計",
    unitPrice: "単価",
    multiply: "×",
    each: "個",
    remove: "削除",
    total: "合計",
    tableLabel: "テーブル番号",
    optional: "（任意）",
    tablePlaceholder: "例: 12",
    noteLabel: "リクエスト",
    notePlaceholder: "アレルギー、辛さなど",
    noteCount: "{count}/500",
    submitHint: "注文後はこの端末の下部「注文」から確認できます。",
    submitPending: "送信中…",
    submit: "キッチンへ送る",
    submitAriaPending: "注文送信中",
    storageNote: "カートは店舗ごとにこのブラウザに保存されます。",
    qtySr: "数量",
    removeAria: "カートから削除",
    addMoreMenu: EN.cart.addMoreMenu,
    addMoreMenuAria: EN.cart.addMoreMenuAria,
  },
  splitBill: EN.splitBill,
  orders: {
    pageTitle: "注文状況",
    pageIntro: "ゲスト注文はこのブラウザのみ表示されます。ログインするとアカウント注文も表示されます。",
    loading: "注文を読み込み中…",
    preparing: "準備中…",
    hubLabel: "注文一覧",
    retry: "再読み込み",
    pollNote: "約{seconds}秒ごとに更新します。動きを減らす設定では自動更新しません。",
    noSession: "注文した同じ端末・ブラウザで開いてください。まだゲストセッションがありません。",
    empty: "この店の注文履歴はまだありません。",
    accountHeading: "アカウントの注文",
    guestHeading: "このブラウザのゲスト注文",
    accountListLabel: "アカウント注文一覧",
    guestListLabel: "ゲスト注文一覧",
    toMenu: "メニュー",
    toMenuAria: "メニューへ",
    toCart: "カート",
    toCartAria: "カートへ",
    toBarrierFree: "リストメニュー",
    toBarrierFreeAria: "リストメニュー（同じカート）",
    loadErrorNoClient: "Supabase 環境変数がないため読み込めません。",
    loadErrorRpc: "一覧を読み込めませんでした。しばらくして再試行してください。",
    accountRpcError: "アカウント注文を読み込めませんでした。",
    accountEmpty: "この店のアカウント連携注文はまだありません。",
    loginLead: "",
    login: "ログイン",
    signup: "新規登録",
    loginTail: "でこの端末のゲスト注文をアカウントに紐づけられます。",
    claimed: "ゲスト注文 {count} 件をアカウントに連携しました。",
    orderLinkAria: "注文詳細へ",
  },
  payment: { offlineLead: "お支払いはレジで", offlineRest: "お願いします。このアプリは注文内容と金額の確認のみです。" },
  status: {
    pending: "受付済み",
    accepted: "確認済み",
    preparing: "調理中",
    ready: "提供準備完了",
    completed: "完了",
    cancelled: "キャンセル",
  },
  orderDetail: {
    notFoundTitle: "注文が見つかりません",
    notFoundBody: "注文した同じ端末・ブラウザで開いてください。",
    notFoundRpc: "注文番号と店舗 URL を確認してください。",
    toCart: "カートへ",
    toCartAria: "カートへ移動",
    receivedSr: "注文受付完了",
    receivedTitle: "注文を受け付けました",
    orderNo: "注文番号",
    revisitHint: "再度見るにはこの端末の下部「注文」をご利用ください。",
    tableLabel: "テーブル",
    requestLabel: "リクエスト",
    linesHeading: "注文内容",
    total: "合計",
    toOrders: "注文一覧",
    toOrdersAria: "注文一覧へ",
    toMenu: "メニューに戻る",
    toMenuAria: "メニューに戻る",
    metaLabel: "テーブルとリクエスト",
  },
};

const ZH_HANS: FlowMessageTree = {
  cart: {
    pageTitle: "确认订单",
    pageIntro: "购物车仅保存在本浏览器。下单后可在此查看，请在柜台付款。",
    loading: "正在加载购物车…",
    empty: "购物车为空。请从菜单或详情页添加菜品。",
    emptyCta: "返回菜单",
    emptyCtaAria: "返回菜单",
    listLabel: "购物车菜品",
    lineTotal: "小计",
    unitPrice: "单价",
    multiply: "×",
    each: "份",
    remove: "删除",
    total: "合计",
    tableLabel: "桌号",
    optional: "（选填）",
    tablePlaceholder: "例如 12",
    noteLabel: "备注",
    notePlaceholder: "过敏、辣度等",
    noteCount: "{count}/500",
    submitHint: "提交后请在本手机底部「订单」查看状态。",
    submitPending: "正在提交…",
    submit: "发送至厨房",
    submitAriaPending: "正在提交订单",
    storageNote: "购物车按店铺仅保存在本浏览器。",
    qtySr: "数量",
    removeAria: "从购物车删除",
    addMoreMenu: EN.cart.addMoreMenu,
    addMoreMenuAria: EN.cart.addMoreMenuAria,
  },
  splitBill: EN.splitBill,
  orders: {
    pageTitle: "订单状态",
    pageIntro: "游客订单仅显示在本浏览器。登录后可查看账户订单。",
    loading: "正在加载订单…",
    preparing: "准备中…",
    hubLabel: "订单与说明",
    retry: "重新加载",
    pollNote: "约每 {seconds} 秒刷新。若开启减少动态效果则停止自动刷新。",
    noSession: "请在下单的同一手机与浏览器中打开。尚无游客会话。",
    empty: "本店尚无订单记录。",
    accountHeading: "账户订单",
    guestHeading: "本浏览器游客订单",
    accountListLabel: "账户订单列表",
    guestListLabel: "游客订单列表",
    toMenu: "菜单",
    toMenuAria: "前往菜单",
    toCart: "购物车",
    toCartAria: "前往购物车",
    toBarrierFree: "列表菜单",
    toBarrierFreeAria: "列表菜单，同一购物车",
    loadErrorNoClient: "无法加载：缺少 Supabase 环境变量。",
    loadErrorRpc: "无法加载列表，请稍后重试。",
    accountRpcError: "无法加载账户订单。",
    accountEmpty: "本店尚无关联到账户的订单。",
    loginLead: "",
    login: "登录",
    signup: "注册",
    loginTail: "可将本机游客订单关联到账户。",
    claimed: "已将 {count} 笔游客订单关联到账户。",
    orderLinkAria: "查看订单详情",
  },
  payment: { offlineLead: "请在柜台", offlineRest: "付款。本应用仅显示订单与金额。" },
  status: {
    pending: "已接单",
    accepted: "已确认",
    preparing: "制作中",
    ready: "可取餐",
    completed: "已完成",
    cancelled: "已取消",
  },
  orderDetail: {
    notFoundTitle: "未找到订单",
    notFoundBody: "请在下单的同一手机与浏览器中打开。",
    notFoundRpc: "请核对订单号与店铺链接。",
    toCart: "购物车",
    toCartAria: "前往购物车",
    receivedSr: "订单已接收",
    receivedTitle: "订单已提交",
    orderNo: "订单号",
    revisitHint: "再次查看请使用本机底部「订单」。",
    tableLabel: "桌号",
    requestLabel: "备注",
    linesHeading: "订单明细",
    total: "合计",
    toOrders: "全部订单",
    toOrdersAria: "订单列表",
    toMenu: "返回菜单",
    toMenuAria: "返回菜单",
    metaLabel: "桌号与备注",
  },
};

const ZH_HANT: FlowMessageTree = {
  ...ZH_HANS,
  cart: { ...ZH_HANS.cart, pageTitle: "確認訂單", pageIntro: "購物車僅保存在本瀏覽器。下單後可在此查看，請至櫃台付款。", loading: "正在載入購物車…", empty: "購物車是空的。請從菜單或詳情頁加入餐點。", emptyCta: "返回菜單", noteLabel: "備註", submit: "送至廚房", submitPending: "正在送出…" },
  orders: { ...ZH_HANS.orders, pageTitle: "訂單狀態", pageIntro: "訪客訂單僅顯示在本瀏覽器。", loading: "正在載入訂單…", claimed: "已將 {count} 筆訪客訂單連結到帳戶。" },
  payment: { offlineLead: "請至櫃台", offlineRest: "付款。本應用僅顯示訂單與金顡。" },
  orderDetail: { ...ZH_HANS.orderDetail, receivedTitle: "訂單已送出", toMenu: "返回菜單" },
};

const VI: FlowMessageTree = {
  ...EN,
  cart: {
    ...EN.cart,
    pageTitle: "Xác nhận đơn",
    pageIntro: "Giỏ chỉ lưu trên trình duyệt này. Thanh toán tại quầy.",
    loading: "Đang tải giỏ…",
    empty: "Giỏ trống. Thêm món từ thực đơn.",
    emptyCta: "Về thực đơn",
    submit: "Gửi bếp",
    submitPending: "Đang gửi…",
    total: "Tổng",
  },
  orders: { ...EN.orders, pageTitle: "Đơn hàng", loading: "Đang tải đơn…", toMenu: "Thực đơn", toCart: "Giỏ hàng" },
  status: { pending: "Đã nhận", accepted: "Đã xác nhận", preparing: "Đang làm", ready: "Sẵn sàng", completed: "Xong", cancelled: "Đã hủy" },
  orderDetail: { ...EN.orderDetail, receivedTitle: "Đã nhận đơn", toMenu: "Về thực đơn" },
};

const TH: FlowMessageTree = {
  ...EN,
  cart: {
    ...EN.cart,
    pageTitle: "ยืนยันคำสั่ง",
    loading: "กำลังโหลดตะกร้า…",
    empty: "ตะกร้าว่าง",
    emptyCta: "กลับเมนู",
    submit: "ส่งครัว",
    submitPending: "กำลังส่ง…",
    total: "รวม",
  },
  orders: { ...EN.orders, pageTitle: "คำสั่งซื้อ", toMenu: "เมนู", toCart: "ตะกร้า" },
  status: { pending: "รับแล้ว", accepted: "ยืนยัน", preparing: "กำลังทำ", ready: "พร้อม", completed: "เสร็จ", cancelled: "ยกเลิก" },
  orderDetail: { ...EN.orderDetail, receivedTitle: "รับคำสั่งแล้ว" },
};

const RU: FlowMessageTree = {
  ...EN,
  cart: {
    ...EN.cart,
    pageTitle: "Проверка заказа",
    loading: "Загрузка корзины…",
    empty: "Корзина пуста",
    emptyCta: "К меню",
    submit: "Отправить на кухню",
    submitPending: "Отправка…",
    total: "Итого",
  },
  orders: { ...EN.orders, pageTitle: "Заказы", toMenu: "Меню", toCart: "Корзина" },
  status: {
    pending: "Принят",
    accepted: "Подтверждён",
    preparing: "Готовится",
    ready: "Готов",
    completed: "Завершён",
    cancelled: "Отменён",
  },
  orderDetail: { ...EN.orderDetail, receivedTitle: "Заказ принят" },
};

const FLOW_BY_LOCALE: Record<AppLocale, FlowMessageTree> = {
  ko: KO,
  en: EN,
  ja: JA,
  "zh-Hans": ZH_HANS,
  "zh-Hant": ZH_HANT,
  vi: VI,
  th: TH,
  ru: RU,
};

export function flowMessages(locale: AppLocale): FlowMessageTree {
  const base = FLOW_BY_LOCALE[locale] ?? EN;
  const splitBill = locale === "ko" ? KO.splitBill : EN.splitBill;
  return {
    ...base,
    splitBill,
    cart: {
      ...base.cart,
      addMoreMenu: locale === "ko" ? KO.cart.addMoreMenu : EN.cart.addMoreMenu,
      addMoreMenuAria: locale === "ko" ? KO.cart.addMoreMenuAria : EN.cart.addMoreMenuAria,
    },
  };
}
