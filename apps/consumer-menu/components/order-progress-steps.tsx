"use client";

import { useConsumerEasyMode } from "@/lib/consumer/consumer-easy-mode-context";
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

function connectorDone(leftStepIndex: number, status: string): boolean {
  const leftKey = STEP_KEYS[leftStepIndex];
  if (!leftKey) return false;
  const state = stepState(leftKey, status);
  return state === "done" || state === "current";
}

/** 주문 접수 후 진행 단계(스티치 OrderProgressSteps 대응). */
export function OrderProgressSteps({ status }: Props) {
  const { locale, m } = useConsumerLocale();
  const { easyMode } = useConsumerEasyMode();
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
        className={`rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center font-medium text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100 ${easyMode ? "text-base" : "text-sm"}`}
      >
        {m.progress.cancelled}
      </p>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-chaya-border/60 bg-chaya-surface shadow-sm dark:border-zinc-800 dark:bg-zinc-900 ${easyMode ? "px-3 py-5" : "px-2 py-4"}`}
      aria-label={m.progress.ariaLabel}
    >
      <ol className="grid grid-cols-3">
        {STEP_KEYS.map((key, i) => {
          const state = stepState(key, status);
          const isLast = i === STEP_KEYS.length - 1;
          return (
            <li key={key} className="flex min-w-0 flex-col items-center">
              <div className={`relative flex w-full items-center justify-center ${easyMode ? "h-12" : "h-10"}`}>
                {!isLast ? (
                  <span
                    className={[
                      "absolute left-[calc(50%+1.125rem)] right-0 top-1/2 h-0.5 -translate-y-1/2",
                      connectorDone(i, status)
                        ? "bg-chaya-primary"
                        : "bg-chaya-border dark:bg-zinc-700",
                    ].join(" ")}
                    aria-hidden
                  />
                ) : null}
                {i > 0 ? (
                  <span
                    className={[
                      "absolute left-0 right-[calc(50%+1.125rem)] top-1/2 h-0.5 -translate-y-1/2",
                      connectorDone(i - 1, status)
                        ? "bg-chaya-primary"
                        : "bg-chaya-border dark:bg-zinc-700",
                    ].join(" ")}
                    aria-hidden
                  />
                ) : null}
                <span
                  className={[
                    "relative z-10 flex shrink-0 items-center justify-center rounded-full font-bold",
                    easyMode ? "h-11 w-11 text-sm" : "h-9 w-9 text-xs",
                    state === "done" || state === "current"
                      ? "bg-chaya-primary text-chaya-on-primary"
                      : "border border-chaya-border bg-white text-zinc-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-400",
                  ].join(" ")}
                  aria-hidden
                >
                  {state === "done" ? "✓" : i + 1}
                </span>
              </div>
              <span
                className={[
                  "mt-1 flex w-full items-start justify-center px-0.5 text-center font-semibold leading-snug",
                  easyMode ? "min-h-[2.75rem] text-sm" : "min-h-[2.25rem] text-[11px] sm:text-xs",
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
            </li>
          );
        })}
      </ol>
    </div>
  );
}
