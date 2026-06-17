import type { ReactNode } from "react";

import { merchantSubPageBgClass } from "@/lib/merchant/merchant-more-sub-styles";

/**
 * `/m/{tenant}/more/*` · tables 등 — 홈/주문/메뉴 탭과 동일한 셸 콘텐츠 너비.
 * (바텀시트용 추가 px-4 없음 · bleed로 배경만 풀폭)
 */
export function MerchantMoreSubPageShell({ children }: { children: ReactNode }) {
  return (
    <div className={`min-h-[50dvh] space-y-3 pb-28 pt-1 ${merchantSubPageBgClass}`}>
      {children}
    </div>
  );
}
