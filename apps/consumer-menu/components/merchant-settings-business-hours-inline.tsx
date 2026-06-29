"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";

import { updateMerchantBusinessHoursInline } from "@/app/m/[tenant]/more/actions";
import { MerchantTimeScrollPicker } from "@/components/merchant-time-scroll-picker";
import { merchantSaveBtnClass } from "@/lib/merchant/merchant-more-sub-styles";

type Props = {
  tenant: string;
  businessOpen: string | null;
  businessClose: string | null;
  salesDayCutoff: string;
  canEdit: boolean;
};

function formatOpenClose(open: string | null, close: string | null): string {
  if (open && close) return `${open} – ${close}`;
  if (open) return `${open}부터`;
  if (close) return `${close}까지`;
  return "미설정";
}

export function MerchantSettingsBusinessHoursInline({
  tenant,
  businessOpen,
  businessClose,
  salesDayCutoff,
  canEdit,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(businessOpen ?? "10:00");
  const [close, setClose] = useState(businessClose ?? "22:00");
  const [cutoff, setCutoff] = useState(salesDayCutoff || "04:00");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (businessOpen) setOpen(businessOpen);
    if (businessClose) setClose(businessClose);
    if (salesDayCutoff) setCutoff(salesDayCutoff);
  }, [businessOpen, businessClose, salesDayCutoff]);

  const hoursSub = useMemo(
    () => formatOpenClose(businessOpen, businessClose),
    [businessOpen, businessClose],
  );

  const persist = () => {
    if (!canEdit || pending) return;
    setMessage(null);
    const fd = new FormData();
    fd.set("tenant_slug", tenant);
    fd.set("business_open", open);
    fd.set("business_close", close);
    fd.set("sales_day_cutoff", cutoff);
    startTransition(async () => {
      const result = await updateMerchantBusinessHoursInline(fd);
      if (!result.ok) {
        setMessage(
          result.code === "forbidden"
            ? "변경 권한이 없습니다."
            : result.code === "invalid_hours"
              ? "시간 형식을 확인해 주세요."
              : "저장에 실패했습니다.",
        );
        return;
      }
      setMessage("저장했습니다.");
      router.refresh();
    });
  };

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E5E7EB] bg-white dark:border-zinc-700 dark:bg-zinc-950">
      <div className="px-3.5 py-3">
        <p className="text-sm font-bold text-[#111827] dark:text-zinc-50">영업 시간</p>
        <p className="text-xs font-medium text-[#9CA3AF]">{hoursSub}</p>
      </div>

      <div className="space-y-3 border-t border-[#F3F4F6] px-3.5 pb-3.5 pt-3 dark:border-zinc-800">
        <div className="flex items-center gap-2.5">
          <MerchantTimeScrollPicker
            label="시작"
            value={open}
            disabled={!canEdit || pending}
            onChange={setOpen}
          />
          <span className="pt-5 text-base font-bold text-[#9CA3AF]" aria-hidden>
            →
          </span>
          <MerchantTimeScrollPicker
            label="마감"
            value={close}
            disabled={!canEdit || pending}
            onChange={setClose}
          />
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-[#374151] dark:text-zinc-300">
            영업일 마감 (매출·손님 집계)
          </p>
          <p className="mb-2 text-[11px] font-medium leading-snug text-[#9CA3AF]">
            이 시각까지를 한 영업일로 묶어요. 예: 04:00이면 새벽 4시 전 결제는 전날 영업일로
            잡혀요.
          </p>
          <MerchantTimeScrollPicker
            label="구분 시각"
            value={cutoff}
            disabled={!canEdit || pending}
            onChange={setCutoff}
          />
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={persist}
            disabled={pending}
            className={`${merchantSaveBtnClass} min-h-[46px] text-[15px]`}
          >
            {pending ? "저장 중…" : "영업 시간 저장"}
          </button>
        ) : null}
      </div>

      {message ? (
        <p role="status" className="px-3.5 pb-3 text-xs font-semibold text-[#1A9E5C]">
          {message}
        </p>
      ) : null}
    </div>
  );
}
