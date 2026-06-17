"use client";

import { useState } from "react";

type Props = {
  membershipId: string;
  tenantSlug: string;
  removeAction: (formData: FormData) => void | Promise<void>;
};

/** 멤버십 연결 삭제 — 슬러그 입력 확인 후 제출 */
export function OpsMerchantRemoveMembershipForm({
  membershipId,
  tenantSlug,
  removeAction,
}: Props) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");

  const slugOk = confirm.trim() === tenantSlug;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-[#F05252] underline-offset-2 hover:underline"
      >
        연결 삭제
      </button>
    );
  }

  return (
    <div className="min-w-[11rem] space-y-2 rounded-lg border border-[rgba(240,82,82,0.35)] bg-[rgba(240,82,82,0.08)] p-2">
      <p className="text-[10px] font-medium leading-snug text-ops-subtle">
        멤버십 연결만 삭제됩니다. 아래에 슬러그를 입력하세요.
      </p>
      <form action={removeAction} className="space-y-2">
        <input type="hidden" name="membership_id" value={membershipId} />
        <label className="block">
          <span className="text-[10px] font-bold text-ops-muted">
            확인: <span className="font-mono text-ops-subtle">{tenantSlug}</span>
          </span>
          <input
            name="confirm_slug"
            required
            autoComplete="off"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={tenantSlug}
            className="mt-1 w-full rounded-lg border border-ops-border bg-ops-surface-2 px-2 py-1.5 font-mono text-xs text-ops-text outline-none focus:border-[#F05252]"
          />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="submit"
            disabled={!slugOk}
            className="rounded-lg border border-[rgba(240,82,82,0.35)] bg-[rgba(240,82,82,0.15)] px-2 py-1 text-[10px] font-extrabold text-[#F05252] disabled:cursor-not-allowed disabled:opacity-40"
          >
            삭제 실행
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              setConfirm("");
            }}
            className="rounded-lg border border-ops-border px-2 py-1 text-[10px] font-semibold text-ops-muted"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
