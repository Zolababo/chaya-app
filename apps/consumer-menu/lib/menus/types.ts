/** 레거시 admin(`ChayaMenus`)과 동일한 필드명을 가정합니다. */
export type ChayaMenuRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  imageUrl: string | null;
  /** 같은 가게 내 정렬. 작을수록 먼저 표시. */
  sortOrder: number;
  /** 품절 시 손님 장바구니 담기 비활성화 (`20260511150000_chaya_menus_is_sold_out.sql`). */
  isSoldOut: boolean;
};

export type MenuListResult = {
  ok: boolean;
  source: "supabase" | "demo";
  items: ChayaMenuRow[];
  /** 조회 실패·빈 목록 등 사용자에게 보일 안내 */
  notice?: string;
};
