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

/** 메뉴판·큰글씨 목록 공통 카테고리 가로 칩 */
export function MenuCategoryChips({ tabs, active, onSelect, ariaLabel, easyMode = false }: Props) {
  if (tabs.length <= 1) return null;

  const chipClass = (selected: boolean) => {
    if (easyMode) {
      return selected
        ? "min-h-[44px] shrink-0 rounded-full bg-chaya-primary px-4 py-2 text-base font-semibold leading-none text-chaya-on-primary"
        : "min-h-[44px] shrink-0 rounded-full border border-zinc-300/90 bg-transparent px-4 py-2 text-base font-medium leading-none text-zinc-700 dark:border-zinc-600 dark:text-zinc-300";
    }
    return selected
      ? "min-h-[36px] shrink-0 rounded-full bg-chaya-primary px-3.5 py-1.5 text-[0.9375rem] font-semibold leading-none text-chaya-on-primary"
      : "min-h-[36px] shrink-0 rounded-full border border-zinc-300/90 bg-transparent px-3.5 py-1.5 text-[0.9375rem] font-medium leading-none text-zinc-700 dark:border-zinc-600 dark:text-zinc-300";
  };

  return (
    <div className="relative -mx-1 mb-1">
      <nav
        className="flex gap-2 overflow-x-auto pb-2 pr-10 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label={ariaLabel}
      >
        {tabs.map((cat) => {
          const selected = active === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => onSelect(cat.key)}
              aria-pressed={selected}
              className={chipClass(selected)}
            >
              {cat.label}
            </button>
          );
        })}
      </nav>
      <div
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-chaya-bg to-transparent dark:from-zinc-950"
        aria-hidden
      />
    </div>
  );
}
