"use client";

import type { ReactNode } from "react";

type Action = {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
  icon?: ReactNode;
};

type Props = {
  open: boolean;
  title: string;
  actions: Action[];
  onClose: () => void;
};

export function MerchantActionSheet({ open, title, actions, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute inset-x-0 bottom-0 animate-[sheet-up_0.22s_ease] rounded-t-[18px] bg-[#F2F3F5] px-4 pb-8 pt-2.5 dark:bg-zinc-900"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3.5 h-1 w-[34px] rounded-full bg-[#E5E7EB] dark:bg-zinc-700" />
        <p className="mb-2.5 text-center text-sm font-bold text-[#9CA3AF]">{title}</p>
        <div className="space-y-2">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              className={[
                "flex min-h-[52px] w-full items-center justify-center gap-2 rounded-[10px] text-base font-bold transition active:opacity-75",
                action.tone === "danger"
                  ? "bg-[#FEF2F2] text-[#DC2626] dark:bg-red-950/40 dark:text-red-300"
                  : "bg-white text-[#111827] dark:bg-zinc-950 dark:text-zinc-50",
              ].join(" ")}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onClose}
            className="min-h-[52px] w-full rounded-[10px] bg-white text-base font-bold text-[#9CA3AF] dark:bg-zinc-950"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
