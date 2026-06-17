import type { MenuTranslationNotice } from "@/lib/merchant/merchant-menu-translation-source";

type Props = {
  notice: MenuTranslationNotice;
  /** 저장 직후 강조 (토스트 아래) */
  prominent?: boolean;
};

/** 점주 메뉴 화면 — 번역이 어디서 왔는지 안내 */
export function MerchantMenuTranslationNotice({ notice, prominent = false }: Props) {
  return (
    <div
      className={[
        "rounded-xl border px-4 py-3",
        prominent
          ? "mb-3 border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40"
          : "mb-4 border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/60",
      ].join(" ")}
      role="status"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-sky-800 ring-1 ring-sky-200 dark:bg-zinc-950 dark:text-sky-200 dark:ring-sky-800">
          {notice.badge}
        </span>
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{notice.title}</p>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{notice.detail}</p>
    </div>
  );
}
