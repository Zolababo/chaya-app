import Link from "next/link";
import type { ReactNode } from "react";

import { MenuListThumb } from "@/components/menu-list-thumb";

type Props = {
  name: string;
  description?: string | null;
  priceLabel: string;
  imageUrl: string | null;
  soldOut?: boolean;
  soldOutLabel?: string;
  detailHref?: string;
  detailAriaLabel?: string;
  trailing?: ReactNode;
  /** 목록형·큰글씨 화면용 */
  large?: boolean;
  /** 큰글씨·목록(Big UI) */
  xlarge?: boolean;
};

const tapTargetClass =
  "flex min-w-0 flex-1 items-center gap-2.5 outline-none transition-colors active:bg-zinc-50/90 sm:gap-3 dark:active:bg-zinc-900/50";

/** 손님·점주 공통 플랫 메뉴 행 (패스트푸드 앱형). */
export function MenuListRow({
  name,
  description,
  priceLabel,
  imageUrl,
  soldOut = false,
  soldOutLabel = "품절",
  detailHref,
  detailAriaLabel,
  trailing,
  large = false,
  xlarge = false,
}: Props) {
  const nameClass = xlarge
    ? "text-xl font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-2xl"
    : large
      ? "text-base font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50"
      : "text-[0.9375rem] font-semibold leading-snug tracking-tight text-zinc-900 dark:text-zinc-50";
  const descClass = xlarge
    ? "mt-1 line-clamp-2 text-base leading-relaxed text-zinc-700 dark:text-zinc-300"
    : large
      ? "mt-0.5 line-clamp-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400"
      : "mt-0.5 line-clamp-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400";
  const priceClass = xlarge
    ? "mt-2 text-xl font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50"
    : large
      ? "mt-1.5 text-base font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50"
      : "mt-1 text-sm font-bold tabular-nums tracking-tight text-zinc-900 dark:text-zinc-50";

  const textBlock = (
    <div className="min-w-0 flex-1 py-0.5 text-left">
      <h3 className={nameClass}>{name}</h3>
      {(description ?? "").trim() ? <p className={descClass}>{description}</p> : null}
      <p className={priceClass}>
        {priceLabel}
        {soldOut ? (
          <span className="ml-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{soldOutLabel}</span>
        ) : null}
      </p>
    </div>
  );

  const body = (
    <>
      <MenuListThumb imageUrl={imageUrl} large={large} xlarge={xlarge} />
      {textBlock}
    </>
  );

  return (
    <div
      className={[
        "flex items-center gap-2 sm:gap-3",
        xlarge ? "py-5 sm:py-6" : large ? "py-4" : "py-2.5 sm:py-3",
        soldOut ? "opacity-55" : "",
      ].join(" ")}
    >
      {detailHref ? (
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
      {trailing ? <div className="flex shrink-0 items-center self-center">{trailing}</div> : null}
    </div>
  );
}
