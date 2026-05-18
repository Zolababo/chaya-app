"use client";

import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";
import { orderStatusLabelForLocale } from "@/lib/i18n/order-status-for-locale";

type Props = {
  status: string;
};

const STEP_KEYS = ["received", "preparing", "ready"] as const;

function stepMatchers(status: string) {
  const s = status.trim().toLowerCase();
  return {
    received: new Set(["pending", "accepted"]),
    preparing: new Set(["preparing"]),
    ready: new Set(["ready", "completed"]),
    status: s,
  };
}

function stepState(
  stepKey: (typeof STEP_KEYS)[number],
  status: string,
): "done" | "current" | "upcoming" | "cancelled" {
  const m = stepMatchers(status);
  if (m.status === "cancelled") return "cancelled";
  const idx = STEP_KEYS.findIndex((k) => m[k].has(m.status));
  if (idx < 0) return "upcoming";
  const stepIdx = STEP_KEYS.indexOf(stepKey);
  if (stepIdx < idx) return "done";
  if (stepIdx === idx) return "current";
  return "upcoming";
}

/** 주문 접수 후 진행 단계(스티치 OrderProgressSteps 대응). */
export function OrderProgressSteps({ status }: Props) {
  const { locale, m } = useConsumerLocale();
  const labels = {
    received: m.progress.stepReceived,
    preparing: m.progress.stepPreparing,
    ready: m.progress.stepReady,
  };
  const s = status.trim().toLowerCase();

  if (s === "cancelled") {
    return (
      <p
        role="status"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
      >
        {m.progress.cancelled}
      </p>
    );
  }

  return (
    <ol
      className="flex items-center justify-between gap-1 rounded-xl border border-chaya-border bg-chaya-surface px-3 py-4 dark:border-zinc-700 dark:bg-zinc-950"
      aria-label={m.progress.ariaLabel}
    >
      {STEP_KEYS.map((key, i) => {
        const state = stepState(key, status);
        const isLast = i === STEP_KEYS.length - 1;
        return (
          <li key={key} className="flex min-w-0 flex-1 items-center">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1 text-center">
              <span
                className={[
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  state === "done" || state === "current"
                    ? "bg-chaya-primary text-chaya-on-primary"
                    : "border border-chaya-border bg-white text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
                ].join(" ")}
                aria-hidden
              >
                {state === "done" ? "✓" : i + 1}
              </span>
              <span
                className={[
                  "text-xs font-semibold leading-tight",
                  state === "current"
                    ? "text-chaya-primary dark:text-orange-400"
                    : "text-zinc-600 dark:text-zinc-400",
                ].join(" ")}
              >
                {labels[key]}
                {state === "current" ? (
                  <span className="sr-only">
                    {" "}
                    ({orderStatusLabelForLocale(status, locale)})
                  </span>
                ) : null}
              </span>
            </div>
            {!isLast ? (
              <span
                className={[
                  "mx-1 mb-5 h-0.5 min-w-[12px] flex-1",
                  state === "done" ? "bg-chaya-primary" : "bg-chaya-border dark:bg-zinc-700",
                ].join(" ")}
                aria-hidden
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
