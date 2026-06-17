import type { MenuTranslationsMap } from "@/lib/i18n/menu-translations";
import type { MenuTranslationSource } from "@/lib/merchant/merchant-menu-translation-source";

import type { MenuOptionGroup } from "./menu-options";
/** 레거시 admin(`ChayaMenus`)과 동일한 필드명을 가정합니다. */
export type ChayaMenuRow = {
  id: string;
  /** 한국어(기본) 메뉴명 — DB `name` */
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  imageUrl: string | null;
  /** 같은 가게 내 정렬. 작을수록 먼저 표시. */
  sortOrder: number;
  /** 품절 시 손님 장바구니 담기 비활성화 (`20260511150000_chaya_menus_is_sold_out.sql`). */
  isSoldOut: boolean;
  /** 손님 「오늘의 메뉴」 배너 (`20260519120000_chaya_menus_merchandising_flags.sql`). */
  isTodaysPick: boolean;
  /** 손님 「사장님 추천」 섹션 (판매 집계와 별도). */
  isStoreRecommended: boolean;
  /** `created_at` — 신규 스티커 판별 (`20260519140000_chaya_menus_created_at.sql`). */
  createdAt: string | null;
  /** `options_json` 컬럼 파싱 결과. 없으면 빈 배열. */
  optionGroups: MenuOptionGroup[];
  /** `translations_json` — ko 외 locale */
  translations: MenuTranslationsMap;
  /** `translations_json._meta.source` — 번역 출처 (점주 UI) */
  translationSource: MenuTranslationSource | null;
  /** AI 추정 맵기 0~5 (`translations_json._meta.spiceLevel`) */
  spiceLevel: number | null;
};

export type MenuListResult = {
  ok: boolean;
  source: "supabase" | "demo";
  items: ChayaMenuRow[];
  /** 조회 실패·빈 목록 등 사용자에게 보일 안내 */
  notice?: string;
};
