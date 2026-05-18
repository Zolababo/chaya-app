type Props = {
  steps: [string, string, string];
  /** 1-based active step (메뉴 홈=1, 장바구니=2, 주문=3) */
  activeStep?: 1 | 2 | 3;
};

/** 손님 주문 3단계 안내 — 배민·요기요형 친숙한 스텝퍼. */
export function ConsumerOrderFlowBanner({ steps, activeStep = 1 }: Props) {
  const items = steps.map((label, i) => {
    const step = (i + 1) as 1 | 2 | 3;
    const active = step === activeStep;
    const done = step < activeStep;
    return { label, step, active, done };
  });

  return (
    <ol
      className="grid grid-cols-3 gap-1 rounded-2xl border border-chaya-border bg-chaya-surface p-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
      aria-label="주문 순서"
    >
      {items.map(({ label, step, active, done }) => (
        <li
          key={step}
          className={[
            "flex min-h-[44px] flex-col items-center justify-center rounded-xl px-1 py-2 text-center text-[10px] font-semibold leading-tight sm:text-[11px]",
            active
              ? "bg-chaya-primary text-chaya-on-primary shadow-sm"
              : done
                ? "bg-chaya-primary/10 text-chaya-primary dark:bg-orange-950/30 dark:text-orange-300"
                : "text-zinc-500 dark:text-zinc-400",
          ].join(" ")}
          aria-current={active ? "step" : undefined}
        >
          <span className="mb-0.5 text-[9px] font-bold opacity-80 sm:text-[10px]" aria-hidden>
            {step}
          </span>
          <span className="line-clamp-2">{label.replace(/^[①②③]\s*/, "")}</span>
        </li>
      ))}
    </ol>
  );
}
