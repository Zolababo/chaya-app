"use client";

type Tab = { key: string; label: string };

type Props = {
  tabs: Tab[];
  active: string;
  onSelect: (key: string) => void;
  ariaLabel: string;
  /** 큰글씨·목록 — 칩만 키우고 레이아웃은 동일 */
  easyMode?: boolean;
};

/** a0 필터 바 스타일 — 배민·쿠팡이츠형 */
export function MenuCategoryChips({ tabs, active, onSelect, ariaLabel, easyMode = false }: Props) {
  if (tabs.length <= 1) return null;

  const chipClass = (selected: boolean) => {
    const base = easyMode
      ? "min-h-[48px] shrink-0 rounded-full px-5 py-2.5 text-lg font-semibold leading-none transition-all"
      : "min-h-[32px] shrink-0 rounded-full px-4 py-1.5 text-sm font-medium leading-none transition-all";
    if (selected) {
      return `${base} bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900`;
    }
    return `${base} border border-chaya-border bg-chaya-surface text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100`;
  };

  return (
    <nav className="relative mb-3" aria-label={ariaLabel}>
      <div className="flex gap-2 overflow-x-auto pb-2 pr-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((cat) => {
          const selected = active === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelect(cat.key)}
              aria-pressed={selected}
              aria-current={selected ? "true" : undefined}
              className={chipClass(selected)}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-chaya-bg to-transparent dark:from-zinc-950"
        aria-hidden
      />
    </nav>
  );
}
