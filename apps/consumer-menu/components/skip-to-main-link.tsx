"use client";

type Props = {
  /** `main` 요소의 `id` (기본: 본문 랜드마크) */
  mainId?: string;
};

/** 해시만으로는 포커스가 안 옮겨지는 브라우저 대비: 클릭 시 `main`에 포커스·스크롤 */
export function SkipToMainLink({ mainId = "main-content" }: Props) {
  return (
    <a
      href={`#${mainId}`}
      className="pointer-events-none fixed left-4 top-4 z-[100] rounded-xl bg-chaya-primary px-4 py-2 text-sm font-semibold text-chaya-on-primary opacity-0 shadow-lg ring-2 ring-white transition-opacity focus:pointer-events-auto focus:opacity-100 focus:outline focus:outline-[3px] focus:outline-offset-[3px] focus:outline-blue-600 dark:ring-zinc-900"
      aria-label="본문 영역으로 건너뛰기"
      onClick={(e) => {
        const el = document.getElementById(mainId);
        if (!(el instanceof HTMLElement)) return;
        e.preventDefault();
        el.focus({ preventScroll: true });
        el.scrollIntoView({ behavior: "instant", block: "start" });
      }}
    >
      본문으로 바로가기
    </a>
  );
}
