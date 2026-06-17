/** 매장 건강 점수 (100점) — 플랫폼·매장 목록·상세 공통 */

export type StoreHealthInput = {
  menuCount: number;
  menusWithPhoto: number;
  ordersLast7d: number;
  /** 점주 활동: audit·주문 중 최근 시각 */
  lastMerchantActivityAt: string | null;
  activeTableCount: number;
};

export type StoreHealthBreakdownItem = {
  id: string;
  label: string;
  points: number;
  max: number;
  ok: boolean;
  detail: string;
};

export type StoreHealthResult = {
  score: number;
  grade: "A" | "B" | "C" | "D";
  items: StoreHealthBreakdownItem[];
};

export type PlatformHealthGrade = StoreHealthResult["grade"];

export function healthGradeFromScore(score: number): PlatformHealthGrade {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export function computeStoreHealth(input: StoreHealthInput, nowMs = Date.now()): StoreHealthResult {
  const menuOk = input.menuCount >= 5;
  const photoOk = input.menusWithPhoto > 0;
  const orders7Ok = input.ordersLast7d > 0;
  const activityOk =
    input.lastMerchantActivityAt != null &&
    nowMs - Date.parse(input.lastMerchantActivityAt) <= THREE_DAYS_MS;
  const qrOk = input.activeTableCount > 0;

  const items: StoreHealthBreakdownItem[] = [
    {
      id: "menus",
      label: "메뉴 5개 이상",
      points: menuOk ? 20 : 0,
      max: 20,
      ok: menuOk,
      detail: `${input.menuCount}개 등록`,
    },
    {
      id: "photo",
      label: "메뉴 사진",
      points: photoOk ? 10 : 0,
      max: 10,
      ok: photoOk,
      detail: photoOk ? `${input.menusWithPhoto}개 사진` : "사진 없음",
    },
    {
      id: "orders7",
      label: "최근 7일 주문",
      points: orders7Ok ? 30 : 0,
      max: 30,
      ok: orders7Ok,
      detail: orders7Ok ? `${input.ordersLast7d}건` : "주문 없음",
    },
    {
      id: "activity",
      label: "점주 활동 (3일)",
      points: activityOk ? 20 : 0,
      max: 20,
      ok: activityOk,
      detail: activityOk ? "최근 접속/주문" : "3일 이상 미활동",
    },
    {
      id: "qr",
      label: "QR·테이블",
      points: qrOk ? 20 : 0,
      max: 20,
      ok: qrOk,
      detail: qrOk ? `${input.activeTableCount}개 활성` : "미발급",
    },
  ];

  const score = items.reduce((s, i) => s + i.points, 0);
  return { score, grade: healthGradeFromScore(score), items };
}
