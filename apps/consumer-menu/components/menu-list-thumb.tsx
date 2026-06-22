import { MenuLazyImage } from "@/components/menu-lazy-image";
import {
  optimizeMenuThumbUrl,
  type MenuThumbVariant,
} from "@/lib/menus/optimize-menu-thumb-url";

type Props = {
  imageUrl: string | null;
  /** barrier-free 등 큰 글씨 화면 */
  large?: boolean;
  /** 큰글씨·목록(Big UI) */
  xlarge?: boolean;
  /** 목록 상단 등 — 즉시 로드 */
  priority?: boolean;
  thumbVariant?: MenuThumbVariant;
};

const SIZE_DEFAULT = "h-16 w-16 sm:h-16 sm:w-16";
const SIZE_LARGE = "h-[5.25rem] w-[5.25rem] sm:h-24 sm:w-24";
const SIZE_XLARGE = "h-28 w-28 sm:h-32 sm:w-32";

/** 메뉴 목록 행용 썸네일 — 장식용이므로 alt 비움 */
export function MenuListThumb({
  imageUrl,
  large = false,
  xlarge = false,
  priority = false,
  thumbVariant,
}: Props) {
  const sizeClass = xlarge ? SIZE_XLARGE : large ? SIZE_LARGE : SIZE_DEFAULT;

  if (!imageUrl?.trim()) {
    return (
      <div
        className={`${sizeClass} shrink-0 rounded-xl bg-zinc-100 dark:bg-zinc-800`}
        aria-hidden
      />
    );
  }

  const variant: MenuThumbVariant =
    thumbVariant ?? (xlarge ? "xlarge" : large ? "large" : "list");
  const src = optimizeMenuThumbUrl(imageUrl, variant) ?? imageUrl;

  return (
    <MenuLazyImage
      src={src}
      fallbackSrc={imageUrl.trim()}
      className={`${sizeClass} shrink-0 rounded-xl object-cover`}
      priority={priority}
    />
  );
}
