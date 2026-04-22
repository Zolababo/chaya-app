/** 레거시 admin(`ChayaMenus`)과 동일한 필드명을 가정합니다. */
export type ChayaMenuRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  imageUrl: string | null;
};

export type MenuListResult = {
  ok: boolean;
  source: "supabase" | "demo";
  items: ChayaMenuRow[];
  /** 조회 실패·빈 목록 등 사용자에게 보일 안내 */
  notice?: string;
};
