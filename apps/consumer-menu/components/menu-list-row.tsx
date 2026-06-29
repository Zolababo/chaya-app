import Link from "next/link";
import type { ReactNode } from "react";

import { MenuListThumb } from "@/components/menu-list-thumb";

type Props = {
  name: string;
  description?: string | null;
  priceLabel: string;
  imageUrl: string | null;
  soldOut?: boolean;
  detailHref?: string;
  onDetailClick?: () => void;
  detailAriaLabel?: string;
  trailing?: ReactNode;
  /** 목록형·큰글씨 화면용 */
  large?: boolean;
  /** 큰글씨·목록(Big UI) */
  xlarge?: boolean;
  /** 첫 화면 썸네일 — eager 로드 */
  imagePriority?: boolean;
};

const tapTargetClass =
  "flex min-w-0 flex-1 items-center gap-2 outline-none transition-colors active:bg-zinc-50/90 sm:gap-2.5 dark:active:bg-zinc-900/50";

/** 손님·점주 공통 플랫 메뉴 행 (패스트푸드 앱형). */
export function MenuListRow({
  name,
  description,
  priceLabel,
  imageUrl,
  soldOut = false,
  detailHref,
  onDetailClick,
  detailAriaLabel,
  trailing,
  large = false,
  xlarge = false,
  imagePriority = false,
}: Props) {
  const nameClass = xlarge
    ? "menu-list-row-name text-2xl font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[1.75rem]"
    : large
      ? "text-base font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg"
      : "text-sm font-medium leading-snug text-zinc-900 dark:text-zinc-50";
  const descClass = xlarge
    ? "menu-list-row-desc mt-1 line-clamp-2 text-lg leading-relaxed text-zinc-700 dark:text-zinc-300"
    : large
      ? "mt-0.5 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
      : "mt-0.5 line-clamp-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400";
  const priceClass = xlarge
    ? "menu-list-row-price mt-2 text-2xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[1.625rem]"
    : large
      ? "mt-1 text-base font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-lg"
      : "mt-0.5 text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-50";

  const textBlock = (
    <div className="min-w-0 flex-1 py-0.5 text-left">
      <div className={large || xlarge ? "flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3" : ""}>
        <h3 className={`${nameClass} ${large || xlarge ? "min-w-0 flex-1" : ""}`}>{name}</h3>
        <p className={`${priceClass} ${large || xlarge ? "shrink-0 sm:mt-0" : ""}`}>{priceLabel}</p>
      </div>
      {(description ?? "").trim() ? <p className={descClass}>{description}</p> : null}
    </div>
  );

  const body = (
    <>
      <MenuListThumb imageUrl={imageUrl} large={large} xlarge={xlarge} priority={imagePriority} />
      {textBlock}
    </>
  );

  return (
    <div
      className={[
        "flex gap-2 sm:gap-2.5",
        xlarge ? "menu-list-row-sr items-start py-5 sm:gap-3 sm:py-6" : large ? "items-start py-4" : "items-center py-0",
        soldOut ? "opacity-55" : "",
      ].join(" ")}
    >
      {onDetailClick ? (
        <button
          type="button"
          onClick={onDetailClick}
          className={`${tapTargetClass} -my-1 ${xlarge ? "min-h-[52px]" : "min-h-[44px]"} flex-1 rounded-lg text-left focus-visible:ring-2 focus-visible:ring-chaya-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-zinc-950`}
          aria-label={detailAriaLabel ?? name}
        >
          {body}
        </button>
      ) : detailHref ? (
        <Link
          href={detailHref}
          className={`${tapTargetClass} -my-1 ${xlarge ? "min-h-[52px]" : "min-h-[44px]"} flex-1 rounded-lg focus-visible:ring-2 focus-visible:ring-chaya-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-offset-zinc-950`}
          aria-label={detailAriaLabel ?? name}
        >
          {body}
        </Link>
      ) : (
        <div className={`${tapTargetClass} min-h-[44px] flex-1`}>{body}</div>
      )}
      {trailing ? <div className="flex shrink-0 items-center self-center pt-0.5">{trailing}</div> : null}
    </div>
  );
}
