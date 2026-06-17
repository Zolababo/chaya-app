import { MessageCircle } from "lucide-react";

import { MerchantSettingsChip } from "@/components/merchant-settings-sheet-ui";

type Props = {
  linked: boolean;
};

export function MerchantKakaoAlimtalkPanel({ linked }: Props) {
  return (
    <section
      id="kakao-alimtalk"
      className="scroll-mt-24 overflow-hidden rounded-[14px] border border-[#E5E7EB] bg-white dark:border-zinc-700 dark:bg-zinc-950"
      aria-label="카카오 알림톡"
    >
      <div className="flex items-start gap-3 border-b border-[#F3F4F6] px-4 py-3.5 dark:border-zinc-800">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#FEE500] text-[#3B1E00]">
          <MessageCircle className="h-4 w-4" strokeWidth={2.25} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-[#0F1117] dark:text-zinc-50">카카오 알림톡 연동</p>
          <p className="text-[11px] font-medium text-[#9CA3AF]">주문 접수·완료 알림을 카카오로 받아요</p>
        </div>
        <MerchantSettingsChip linked={linked}>{linked ? "연동" : "미연동"}</MerchantSettingsChip>
      </div>

      <div className="space-y-2 px-4 py-3.5">
        {linked ? (
          <p className="text-xs font-semibold text-[#00A85A]">연동된 매장입니다.</p>
        ) : (
          <p className="text-xs font-medium text-[#9CA3AF]">
            카카오 알림톡 연동은 현재 준비 중입니다. 다음 단계에서 설정 화면을 보완할 예정입니다.
          </p>
        )}
      </div>
    </section>
  );
}
