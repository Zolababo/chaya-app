import { orderStatusLabel } from "@/lib/orders/order-status-label";

type Props = {
  status: string;
};

const STEPS = [
  { key: "received", label: "접수", match: new Set(["pending", "accepted"]) },
  { key: "preparing", label: "조리", match: new Set(["preparing"]) },
  { key: "ready", label: "준비·서빙", match: new Set(["ready", "completed"]) },
] as const;

function stepState(
  step: (typeof STEPS)[number],
  status: string,
): "done" | "current" | "upcoming" | "cancelled" {
  const s = status.trim().toLowerCase();
  if (s === "cancelled") return "cancelled";
  const idx = STEPS.findIndex((st) => st.match.has(s));
  if (idx < 0) return "upcoming";
  const stepIdx = STEPS.findIndex((st) => st.key === step.key);
  if (stepIdx < idx) return "done";
  if (stepIdx === idx) return "current";
  return "upcoming";
}

/** 주문 접수 후 진행 단계(스티치 OrderProgressSteps 대응). */
export function OrderProgressSteps({ status }: Props) {
  const s = status.trim().toLowerCase();
  if (s === "cancelled") {
    return (
      <p
        role="status"
        className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm font-medium text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
      >
        주문이 취소되었습니다.
      </p>
    );
  }

  return (
    <ol
      className="flex items-center justify-between gap-1 rounded-xl border border-chaya-border bg-chaya-surface px-3 py-4 dark:border-zinc-700 dark:bg-zinc-950"
      aria-label="주문 진행 단계"
    >
      {STEPS.map((step, i) => {
        const state = stepState(step, status);
        const isLast = i === STEPS.length - 1;
        return (
          <li key={step.key} className="flex min-w-0 flex-1 items-center">
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
                  state === "current" ? "text-chaya-primary dark:text-orange-400" : "text-zinc-600 dark:text-zinc-400",
                ].join(" ")}
              >
                {step.label}
                {state === "current" ? (
                  <span className="sr-only"> (현재 단계, {orderStatusLabel(status)})</span>
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
