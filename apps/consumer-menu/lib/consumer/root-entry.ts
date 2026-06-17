/** 기본 손님 데모 테넌트 — 루트 `/` 진입 시 사용 */
export const CONSUMER_DEMO_TENANT_SLUG = "demo";

export function consumerDemoMenuPath(): string {
  return `/t/${CONSUMER_DEMO_TENANT_SLUG}`;
}

/** `CHAYA_ROOT_ROLE_PICKER=1` 이면 `/` 에 역할 선택 화면 유지 (점주·운영 디버그용) */
export function rootShowsRolePicker(): boolean {
  return process.env.CHAYA_ROOT_ROLE_PICKER?.trim() === "1";
}
