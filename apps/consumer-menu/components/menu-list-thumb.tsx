const THUMB_SZ = "h-14 w-14 sm:h-16 sm:w-16";

/** 메뉴 목록 행용 썸네일 — 장식용이므로 alt 비움 */
export function MenuListThumb({ imageUrl }: { imageUrl: string | null }) {
  if (!imageUrl?.trim()) {
    return (
      <div
        className={`${THUMB_SZ} shrink-0 rounded-lg bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900`}
        aria-hidden
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageUrl} alt="" className={`${THUMB_SZ} shrink-0 rounded-lg object-cover`} />
  );
}
