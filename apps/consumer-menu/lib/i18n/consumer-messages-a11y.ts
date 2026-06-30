import type { AppLocale } from "./locales";

export type A11yMessageTree = {
  settings: {
    title: string;
    intro: string;
    openAria: string;
    screenReaderOn: string;
    screenReaderOff: string;
    screenReaderOffDone: string;
    fontSizeLabel: string;
    fontNormal: string;
    fontLarge: string;
    fontXl: string;
    displayLabel: string;
    highContrastName: string;
    highContrastDesc: string;
    voiceName: string;
    voiceDesc: string;
    voiceBadge: string;
    voiceOn: string;
    voiceOff: string;
    done: string;
    listMenuHint: string;
    listMenuLink: string;
  };
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
    voiceOrderPlaced: string;
    voiceOrderStatus: string;
    voiceOrdersHubSummary: string;
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
  settings: {
    title: "베리어프리 모드",
    intro: "한 번 누르면 목록형 메뉴와 큰 글씨 화면으로 바뀝니다. 장바구니·주문에도 같이 적용되며, 이 브라우저를 쓰는 동안 유지됩니다.",
    openAria: "베리어프리 모드",
    screenReaderOn: "베리어프리 모드 켜짐. 목록형 메뉴와 큰 글씨로 바뀌었습니다. 끄려면 다시 누르세요.",
    screenReaderOff: "베리어프리 모드 켜기. 목록형 메뉴로 전환합니다.",
    screenReaderOffDone: "베리어프리 모드 꺼짐. 일반 메뉴로 돌아갑니다.",
    fontSizeLabel: "글자 크기",
    fontNormal: "기본",
    fontLarge: "크게",
    fontXl: "매우 크게",
    displayLabel: "화면 설정",
    highContrastName: "고대비 모드",
    highContrastDesc: "글씨와 테두리를 더 또렷하게",
    voiceName: "음성 안내",
    voiceDesc: "메뉴 이름·가격을 소리로 읽어드려요",
    voiceBadge: "음성 안내 켜짐",
    voiceOn: "음성 안내가 켜졌어요. 메뉴를 선택하면 읽어드려요.",
    voiceOff: "음성 안내가 꺼졌어요.",
    done: "설정 완료",
    listMenuHint: "매우 크게 모드에서는 목록형 메뉴가 더 편할 수 있어요.",
    listMenuLink: "목록형 메뉴 열기",
  },
  barrierFree: {
    pageTitle: "베리어프리 메뉴",
    pageIntro:
      "TalkBack·VoiceOver에 맞춘 목록형 메뉴입니다. 담기·장바구니·주문은 일반 메뉴와 같은 저장소를 씁니다.",
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
    addedOne: "{name} 장바구니에 담았습니다.",
    voiceOrderPlaced: "주문이 접수됐어요. 카운터에서 결제해 주세요.",
    voiceOrderStatus: "주문 상태, {status}.",
    voiceOrdersHubSummary:
      "진행 중 주문 {count}건, 카운터 결제 예정 {total}. 결제는 카운터에서 해 주세요.",
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
  settings: {
    title: "Barrier-free mode",
    intro: "One tap switches to a list menu with larger text. Applies to cart and orders too, for this browser session.",
    openAria: "Barrier-free mode",
    screenReaderOn: "Barrier-free mode on. List menu with larger text. Press again to turn off.",
    screenReaderOff: "Turn on barrier-free mode. Switch to list menu.",
    screenReaderOffDone: "Barrier-free mode off. Back to the standard menu.",
    fontSizeLabel: "Text size",
    fontNormal: "Default",
    fontLarge: "Large",
    fontXl: "Extra large",
    displayLabel: "Display",
    highContrastName: "High contrast",
    highContrastDesc: "Sharper text and borders",
    voiceName: "Voice guidance",
    voiceDesc: "Reads menu names and prices aloud",
    voiceBadge: "Voice on",
    voiceOn: "Voice guidance is on. Select a menu item to hear it.",
    voiceOff: "Voice guidance is off.",
    done: "Done",
    listMenuHint: "Extra large text works well with the list menu view.",
    listMenuLink: "Open list menu",
  },
  barrierFree: {
    pageTitle: "Accessible menu",
    pageIntro:
      "List menu layout for TalkBack and VoiceOver. Cart and orders share the same storage as the main menu.",
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
    addedOne: "Added {name} to cart.",
    voiceOrderPlaced: "Your order is in. Please pay at the counter.",
    voiceOrderStatus: "Order status: {status}.",
    voiceOrdersHubSummary:
      "{count} order(s) in progress, {total} due at the counter. Please pay at the counter.",
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
  settings: {
    title: "バリアフリー設定",
    intro: "タップでリスト型メニューと大きな文字に切り替わります。カート・注文にも適用され、このブラウザの間保持されます。",
    openAria: "バリアフリー・モード",
    screenReaderOn: "バリアフリーモードオン。リスト型メニューと大きな文字に切り替わりました。もう一度押すとオフになります。",
    screenReaderOff: "バリアフリーモードをオン。リスト型メニューに切り替えます。",
    screenReaderOffDone: "バリアフリーモードオフ。通常メニューに戻りました。",
    fontSizeLabel: "文字サイズ",
    fontNormal: "標準",
    fontLarge: "大きく",
    fontXl: "とても大きく",
    displayLabel: "画面設定",
    highContrastName: "ハイコントラスト",
    highContrastDesc: "文字と枠線をよりはっきり",
    voiceName: "音声ガイド",
    voiceDesc: "メニュー名・価格を読み上げます",
    voiceBadge: "音声ガイドオン",
    voiceOn: "音声ガイドがオンになりました。メニューを選ぶと読み上げます。",
    voiceOff: "音声ガイドがオフになりました。",
    done: "設定完了",
    listMenuHint: "とても大きい文字ではリスト型メニューが使いやすい場合があります。",
    listMenuLink: "リスト型メニューを開く",
  },
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
  settings: {
    title: "无障碍设置",
    intro: "点按即可切换为列表菜单和较大文字。购物车与订单同样适用，在本浏览器会话期间保持。",
    openAria: "无障碍模式",
    screenReaderOn: "无障碍模式已开启。已切换为列表菜单和较大文字。再次点按可关闭。",
    screenReaderOff: "开启无障碍模式。切换到列表菜单。",
    screenReaderOffDone: "无障碍模式已关闭。已返回普通菜单。",
    fontSizeLabel: "文字大小",
    fontNormal: "默认",
    fontLarge: "较大",
    fontXl: "特大",
    displayLabel: "显示",
    highContrastName: "高对比度",
    highContrastDesc: "让文字与边框更清晰",
    voiceName: "语音播报",
    voiceDesc: "朗读菜单名称与价格",
    voiceBadge: "语音已开启",
    voiceOn: "语音播报已开启。选择菜单项即可朗读。",
    voiceOff: "语音播报已关闭。",
    done: "完成",
    listMenuHint: "特大文字模式下，列表菜单可能更易阅读。",
    listMenuLink: "打开列表菜单",
  },
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

const ZH_HANT: A11yMessageTree = {
  settings: {
    title: "無障礙設定",
    intro: "點按即可切換為列表選單與較大文字。購物車與訂單同樣適用，在本瀏覽器工作階段期間保持。",
    openAria: "開啟無障礙模式",
    screenReaderOn: "無障礙模式已開啟。已切換為列表選單與較大文字。再按一次可關閉。",
    screenReaderOff: "開啟無障礙模式。切換至列表選單。",
    screenReaderOffDone: "無障礙模式已關閉。已返回一般選單。",
    fontSizeLabel: "文字大小",
    fontNormal: "預設",
    fontLarge: "較大",
    fontXl: "特大",
    displayLabel: "顯示",
    highContrastName: "高對比",
    highContrastDesc: "讓文字與邊框更清晰",
    voiceName: "語音播報",
    voiceDesc: "朗讀菜單名稱與價格",
    voiceBadge: "語音已開啟",
    voiceOn: "語音播報已開啟。選擇菜單項目即可朗讀。",
    voiceOff: "語音播報已關閉。",
    done: "完成",
    listMenuHint: "特大文字模式下，列表菜單可能較易閱讀。",
    listMenuLink: "開啟列表菜單",
  },
  barrierFree: {
    ...ZH_HANS.barrierFree,
    pageTitle: "列表菜單",
    toGridMenu: "返回主菜單",
  },
  orderLive: { ...ZH_HANS.orderLive },
};

const BY_LOCALE: Record<AppLocale, A11yMessageTree> = {
  ko: KO,
  en: EN,
  ja: JA,
  "zh-Hans": ZH_HANS,
  "zh-Hant": ZH_HANT,
};

export function a11yMessages(locale: AppLocale): A11yMessageTree {
  return BY_LOCALE[locale] ?? EN;
}
