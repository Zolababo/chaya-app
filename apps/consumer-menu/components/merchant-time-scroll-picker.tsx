"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const ITEM_H = 40;
const REPEAT = 9;

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

type Props = {
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  label?: string;
};

function parseHm(raw: string): [string, string] {
  if (/^\d{2}:\d{2}$/.test(raw)) return [raw.slice(0, 2), raw.slice(3, 5)];
  return ["14", "00"];
}

type DrumProps = {
  values: string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  ariaLabel: string;
};

function DrumWheel({ values, value, onChange, disabled, ariaLabel }: DrumProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lock = useRef(false);
  const [focused, setFocused] = useState(value);

  const items = Array.from({ length: REPEAT }, () => values).flat();

  const scrollToValue = useCallback(
    (v: string, behavior: ScrollBehavior = "auto") => {
      const el = ref.current;
      if (!el) return;
      const idx = values.indexOf(v);
      if (idx < 0) return;
      const mid = Math.floor(REPEAT / 2);
      el.scrollTo({ top: (mid * values.length + idx) * ITEM_H, behavior });
      setFocused(v);
    },
    [values],
  );

  useEffect(() => {
    scrollToValue(value);
  }, [value, scrollToValue]);

  const settle = useCallback(() => {
    const el = ref.current;
    if (!el || lock.current || disabled) return;

    const raw = Math.round(el.scrollTop / ITEM_H);
    const valIdx = ((raw % values.length) + values.length) % values.length;
    const next = values[valIdx]!;
    setFocused(next);
    if (next !== value) onChange(next);

    const mid = Math.floor(REPEAT / 2);
    const ideal = mid * values.length + valIdx;
    if (Math.abs(raw - ideal) > values.length * 0.75) {
      lock.current = true;
      el.scrollTop = ideal * ITEM_H;
      requestAnimationFrame(() => {
        lock.current = false;
      });
    }
  }, [values, value, onChange, disabled]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onScroll = () => {
      if (lock.current) return;
      const raw = Math.round(el.scrollTop / ITEM_H);
      const valIdx = ((raw % values.length) + values.length) % values.length;
      setFocused(values[valIdx]!);
      if (timer) clearTimeout(timer);
      timer = setTimeout(settle, 90);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (timer) clearTimeout(timer);
      el.removeEventListener("scroll", onScroll);
    };
  }, [values, settle]);

  return (
    <div
      ref={ref}
      role="listbox"
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      className={[
        "relative z-[2] h-[120px] flex-1 overflow-y-auto overscroll-y-contain",
        "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
        disabled ? "pointer-events-none opacity-50" : "",
      ].join(" ")}
    >
      <div className="h-10" aria-hidden />
      {items.map((v, i) => {
        const selected = v === focused;
        return (
          <div
            key={`${i}-${v}`}
            role="option"
            aria-selected={selected}
            className={[
              "flex h-10 items-center justify-center tabular-nums transition-[color,font-size] duration-100",
              selected ? "text-[26px] font-extrabold text-[#111827]" : "text-[22px] font-extrabold text-[#9CA3AF]",
            ].join(" ")}
          >
            {v}
          </div>
        );
      })}
      <div className="h-10" aria-hidden />
    </div>
  );
}

/** 무한 스크롤 드럼 — 가운데 주황 밴드 안 값만 선택 */
export function MerchantTimeScrollPicker({ value, onChange, disabled, label }: Props) {
  const [h, m] = parseHm(value);

  const setPair = (nh: string, nm: string) => onChange(`${nh}:${nm}`);

  return (
    <div className="min-w-0 flex-1">
      {label ? (
        <p className="mb-1 text-center text-[11px] font-bold tracking-wide text-[#9CA3AF]">{label}</p>
      ) : null}
      <div className="relative flex items-center justify-center gap-0.5 rounded-[10px] border-[1.5px] border-[#E5E7EB] bg-white px-1 dark:border-zinc-700 dark:bg-zinc-950">
        <div
          className="pointer-events-none absolute inset-x-0 top-1/2 z-[1] h-10 -translate-y-1/2 rounded border-y-[1.5px] border-chaya-primary bg-chaya-primary/[0.08]"
          aria-hidden
        />
        <DrumWheel
          values={HOURS}
          value={h}
          onChange={(nh) => setPair(nh, m)}
          disabled={disabled}
          ariaLabel={`${label ?? "시간"} 시`}
        />
        <span className="relative z-[2] px-0.5 text-2xl font-black text-[#111827] dark:text-zinc-50">:</span>
        <DrumWheel
          values={MINUTES}
          value={m}
          onChange={(nm) => setPair(h, nm)}
          disabled={disabled}
          ariaLabel={`${label ?? "시간"} 분`}
        />
      </div>
    </div>
  );
}
