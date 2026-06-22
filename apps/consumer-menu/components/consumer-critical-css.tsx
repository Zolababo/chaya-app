import { CONSUMER_MENU_CRITICAL_CSS } from "@/lib/consumer/consumer-menu-critical-css";

/** 손님 메뉴 첫 paint — root layout `<head>` 에만 삽입 */
export function ConsumerCriticalCss() {
  return (
    <style
      id="chaya-consumer-critical-css"
      data-chaya-critical=""
      dangerouslySetInnerHTML={{ __html: CONSUMER_MENU_CRITICAL_CSS }}
    />
  );
}
