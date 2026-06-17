"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { updateMerchantBreakTimeInline } from "@/app/m/[tenant]/more/actions";
import { MerchantSettingsToggle } from "@/components/merchant-settings-sheet-ui";
import { MerchantTimeScrollPicker } from "@/components/merchant-time-scroll-picker";
import { merchantSaveBtnClass } from "@/lib/merchant/merchant-more-sub-styles";

type Props = {
  tenant: string;
  breakStart: string | null;
  breakEnd: string | null;
  canEdit: boolean;
};

function breakIsConfigured(start: string | null, end: string | null): boolean {
  return !!(start?.trim() && end?.trim());
}

function formatBreakRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

export function MerchantSettingsBreakInline({
  tenant,
  breakStart,
  breakEnd,
  canEdit,
}: Props) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(breakIsConfigured(breakStart, breakEnd));
  const [start, setStart] = useState(breakStart ?? "14:00");
  const [end, setEnd] = useState(breakEnd ?? "17:00");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const on = breakIsConfigured(breakStart, breakEnd);
    setEnabled(on);
    if (breakStart) setStart(breakStart);
    if (breakEnd) setEnd(breakEnd);
  }, [breakStart, breakEnd]);

  const breakSub = useMemo(() => {
    if (!enabled) return "사용 안 함";
    if (breakIsConfigured(breakStart, breakEnd)) {
      return formatBreakRange(breakStart!, breakEnd!);
    }
    return "시간 설정 중";
  }, [enabled, breakStart, breakEnd]);

  const persist = (nextStart: string, nextEnd: string, opts?: { silent?: boolean }) => {
    if (!canEdit || pending) return;
    if (!opts?.silent) setMessage(null);
    const fd = new FormData();
    fd.set("tenant_slug", tenant);
    fd.set("break_start", nextStart);
    fd.set("break_end", nextEnd);
    startTransition(async () => {
      const result = await updateMerchantBreakTimeInline(fd);
      if (!result.ok) {
        if (!opts?.silent) {
          setMessage(
            result.code === "forbidden"
              ? "변경 권한이 없습니다."
              : result.code === "invalid_break"
                ? "시작·종료를 모두 설정해 주세요."
                : "저장에 실패했습니다.",
          );
        }
        if (opts?.silent) {
          setEnabled(breakIsConfigured(breakStart, breakEnd));
        }
        return;
      }
      if (!opts?.silent) {
        setMessage("저장했습니다.");
      }
      router.refresh();
    });
  };

  const onToggleEnabled = () => {
    if (!canEdit || pending) return;
    const next = !enabled;
    setEnabled(next);
    setMessage(null);
    if (!next) {
      persist("", "", { silent: true });
    }
  };

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div>
          <p className="text-sm font-bold text-[#111827] dark:text-zinc-50">브레이크타임</p>
          <p className="text-xs font-medium text-[#9CA3AF]">{breakSub}</p>
        </div>
        <MerchantSettingsToggle
          on={enabled}
          onToggle={onToggleEnabled}
          disabled={!canEdit || pending}
          ariaLabel="브레이크타임"
        />
      </div>

      {enabled ? (
        <div className="space-y-2.5 border-t border-[#F3F4F6] px-3.5 pb-3.5 pt-3 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <MerchantTimeScrollPicker
              label="시작"
              value={start}
              disabled={!canEdit || pending}
              onChange={setStart}
            />
            <span className="pt-5 text-base font-bold text-[#9CA3AF]" aria-hidden>
              →
            </span>
            <MerchantTimeScrollPicker
              label="종료"
              value={end}
              disabled={!canEdit || pending}
              onChange={setEnd}
            />
          </div>
          {canEdit ? (
            <button
              type="button"
              onClick={() => persist(start, end)}
              disabled={pending}
              className={`${merchantSaveBtnClass} min-h-[46px] text-[15px]`}
            >
              {pending ? "저장 중…" : "브레이크타임 저장"}
            </button>
          ) : null}
        </div>
      ) : null}

      {message ? (
        <p role="status" className="px-3.5 pb-3 text-xs font-semibold text-[#1A9E5C]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
