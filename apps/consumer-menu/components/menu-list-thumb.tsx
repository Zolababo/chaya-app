type Props = {
  imageUrl: string | null;
  /** barrier-free 등 큰 글씨 화면 */
  large?: boolean;
};

const SIZE_DEFAULT = "h-[4.75rem] w-[4.75rem] sm:h-20 sm:w-20";
const SIZE_LARGE = "h-24 w-24 sm:h-[6.5rem] sm:w-[6.5rem]";

/** 메뉴 목록 행용 썸네일 — 장식용이므로 alt 비움 */
export function MenuListThumb({ imageUrl, large = false }: Props) {
  const sizeClass = large ? SIZE_LARGE : SIZE_DEFAULT;

  if (!imageUrl?.trim()) {
    return (
      <div
        className={`${sizeClass} shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800`}
        aria-hidden
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imageUrl}
      alt=""
      className={`${sizeClass} shrink-0 rounded-lg object-cover`}
    />
  );
}
