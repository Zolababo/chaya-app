/** 점주 설정 바텀시트 — 레이아웃에서 주입하는 스냅샷 */
export type MerchantSettingsSheetSnapshot = {
  tenant: string;
  storeName: string;
  storeIntro: string | null;
  ordersAccepting: boolean;
  breakStart: string | null;
  breakEnd: string | null;
  tableCount: number | null;
  staffCount: number | null;
  canManageStore: boolean;
  canManageHours: boolean;
  canManageTables: boolean;
  canViewStaff: boolean;
  canUseNotifications: boolean;
  canExportSales: boolean;
  kakaoAlimtalkLinked: boolean;
};
