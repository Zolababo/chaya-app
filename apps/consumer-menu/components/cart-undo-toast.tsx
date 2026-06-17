"use client";

import { chayaAppShellNavInnerClass } from "@/lib/responsive/chaya-app-shell";

type Props = {
  message: string;
  actionLabel: string;
  visible: boolean;
  onUndo: () => void;
};

export function CartUndoToast({ message, actionLabel, visible, onUndo }: Props) {
  return (
    <div
      className={`fixed inset-x-0 bottom-[max(5.75rem,calc(env(safe-area-inset-bottom)+4.75rem))] z-50 ${chayaAppShellNavInnerClass} chaya-app-shell--consumer flex items-center justify-between gap-3 rounded-xl bg-zinc-800 px-4 py-3 text-white shadow-lg transition-all duration-300 dark:bg-zinc-900 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0"
      }`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <p className="min-w-0 text-sm font-semibold">{message}</p>
      <button
        type="button"
        className="shrink-0 rounded-md px-2 py-1 text-sm font-extrabold text-amber-300"
        onClick={onUndo}
      >
        {actionLabel}
      </button>
    </div>
  );
}
