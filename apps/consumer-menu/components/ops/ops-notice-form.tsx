"use client";

import { useActionState, useState } from "react";

import { sendPlatformNoticeAction, type SendNoticeState } from "@/app/ops/settings/actions";
import { OpsCard } from "@/components/ops/ops-ui";

const NOTICE_TARGETS = ["전체 매장", "영업중만", "위험 매장", "신규 매장"] as const;

/** 플랫폼 공지 → 점주 알림 페이지 (/m/tenant/notifications) */
export function OpsNoticeForm() {
  const [target, setTarget] = useState<(typeof NOTICE_TARGETS)[number]>("전체 매장");
  const [state, formAction, pending] = useActionState<SendNoticeState, FormData>(
    sendPlatformNoticeAction,
    null,
  );

  return (
    <OpsCard id="notice" title="공지 발송" subtitle="전체 또는 특정 매장 그룹에 발송">
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="target" value={target} />
        <div className="flex flex-wrap gap-2">
          {NOTICE_TARGETS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTarget(t)}
              className={[
                "rounded-lg border px-3.5 py-1.5 text-xs font-bold transition",
                target === t
                  ? "border-[rgba(91,107,248,0.4)] bg-[rgba(91,107,248,0.18)] text-[#5B6BF8]"
                  : "border-ops-border bg-ops-surface-2 text-[#4A5568] hover:border-ops-border-2",
              ].join(" ")}
            >
              {t}
            </button>
          ))}
        </div>
        <textarea
          name="body"
          required
          minLength={2}
          maxLength={2000}
          placeholder={"공지 내용을 입력하세요\n예: 새 기능 업데이트 안내, 시스템 점검 일정 등"}
          className="h-[100px] w-full resize-none rounded-lg border border-ops-border bg-ops-surface-2 px-3.5 py-3 text-[13px] font-medium text-ops-text outline-none transition placeholder:text-[#4A5568] focus:border-[#5B6BF8]"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-[#5B6BF8] py-2.5 text-[13px] font-extrabold text-white transition hover:opacity-85 disabled:opacity-50"
        >
          {pending ? "발송 중…" : "📢 " + target + "에 발송하기"}
        </button>
        {state?.ok === false ? (
          <p role="alert" className="text-center text-xs font-semibold text-[#F05252]">
            {state.message}
          </p>
        ) : null}
        {state?.ok === true ? (
          <p className="text-center text-xs font-semibold text-[#22D3A0]">
            {state.targetLabel} {state.sentCount}곳에 공지를 저장했습니다. 점주앱 알림에서 확인할 수
            있습니다.
          </p>
        ) : null}
      </form>
    </OpsCard>
  );
}
