import { redirect } from "next/navigation";

import { ChayaRolePicker } from "@/components/chaya-role-picker";
import { consumerDemoMenuPath, rootShowsRolePicker } from "@/lib/consumer/root-entry";

/**
 * 기본: `/` → 손님 데모 (`/t/demo`). 역할 선택이 필요하면 `/start` 또는 `CHAYA_ROOT_ROLE_PICKER=1`.
 * 점주 홈 화면 추가: `/m/login` · `/m/login/homescreen-manifest` (`start_url: /m/login`).
 */
export default function HomePage() {
  if (rootShowsRolePicker()) {
    return <ChayaRolePicker />;
  }
  redirect(consumerDemoMenuPath());
}
