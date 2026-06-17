"use client";

import { useState } from "react";
import { ChevronDown, CircleDot } from "lucide-react";

import { MerchantHoursSettingsPanel } from "@/components/merchant-hours-settings-panel";
import {
  MerchantSettingsBadge,
  MerchantSettingsIconBox,
} from "@/components/merchant-settings-sheet-ui";

type Props = {
  tenant: string;
  ordersAccepting: boolean;
  breakStart: string | null;
  breakEnd: string | null;
  canEdit: boolean;
};

/** 더보기 허브 전용 — 영업 설정만 펼치기 */
export function MerchantMoreHoursAccordion({
  tenant,
  ordersAccepting,
  breakStart,
  breakEnd,
  canEdit,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-zinc-950">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full min-h-[52px] items-center justify-between gap-3 px-4 py-3 text-left transition active:bg-[#F2F3F5] dark:active:bg-zinc-900"
        aria-expanded={open}
      >
        <span className="flex min-w-0 flex-1 items-center gap-[11px]">
          <MerchantSettingsIconBox icon={CircleDot} accent={ordersAccepting ? "green" : "closed"} />
          <span className="min-w-0">
            <span className="block text-[15px] font-bold text-[#111827] dark:text-zinc-50">영업 설정</span>
            <span className="mt-0.5 block text-xs font-medium text-[#9CA3AF]">영업 상태 · 브레이크타임</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <MerchantSettingsBadge tone={ordersAccepting ? "open" : "closed"}>
            {ordersAccepting ? "영업중" : "영업종료"}
          </MerchantSettingsBadge>
          <ChevronDown
            className={[
              "h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
            strokeWidth={2}
            aria-hidden
          />
        </span>
      </button>
      {open ? (
        <div className="border-t border-[#F3F4F6] bg-[#F2F3F5] px-4 pb-4 pt-3.5 dark:border-zinc-800 dark:bg-zinc-900/50">
          <MerchantHoursSettingsPanel
            tenant={tenant}
            settings={{
              tenantSlug: tenant,
              displayName: null,
              logoUrl: null,
              intro: null,
              ordersAccepting,
              breakStart,
              breakEnd,
              kakaoAlimtalkLinkedAt: null,
              billingPlan: "starter",
            }}
            canEdit={canEdit}
            embedded
          />
        </div>
      ) : null}
    </div>
  );
}
