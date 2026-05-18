const THUMB_SZ =
  "h-[4.25rem] w-[4.25rem] shrink-0 rounded-xl ring-1 ring-chaya-border/80 sm:h-[4.5rem] sm:w-[4.5rem] dark:ring-zinc-700";

/** 메뉴 목록 행용 썸네일 — 장식용이므로 alt 비움 */
export function MenuListThumb({ imageUrl }: { imageUrl: string | null }) {
  if (!imageUrl?.trim()) {
    return (
      <div
        className={`${THUMB_SZ} bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900`}
        aria-hidden
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt="" className={`${THUMB_SZ} object-cover`} />
  );
}
