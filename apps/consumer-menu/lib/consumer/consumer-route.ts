/** `/t/{tenant}` 홈(메뉴판) — 하위 경로 제외 */
export function isConsumerMenuHomePath(pathname: string): boolean {
  return /^\/t\/[^/]+\/?$/.test(pathname);
}

export const CONSUMER_ROUTE_HEADER = "x-chaya-consumer-route";

export function isConsumerMenuHomeRequest(headers: Headers): boolean {
  return headers.get(CONSUMER_ROUTE_HEADER) === "home";
}
