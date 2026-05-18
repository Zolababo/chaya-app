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
};

const rowBodyClass =
  "flex min-h-[72px] min-w-0 flex-1 items-center gap-3 rounded-xl outline-none ring-chaya-primary ring-offset-2 ring-offset-background transition-colors hover:bg-zinc-50/80 focus-visible:ring-2 dark:ring-offset-zinc-950 dark:hover:bg-zinc-900/50";

/** 손님·점주 미리보기 공통 메뉴 행 (한국형 QR 리스트). */
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
}: Props) {
  const textBlock = (
    <div className="min-w-0 flex-1 py-0.5 text-left">
      <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-zinc-900 dark:text-zinc-50">
        {name}
      </h3>
      {(description ?? "").trim() ? (
        <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      ) : null}
      <p className="mt-1.5 text-base font-bold tabular-nums tracking-tight text-chaya-primary dark:text-orange-400">
        {priceLabel}
        {soldOut ? (
          <span className="ml-2 align-middle text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {soldOutLabel}
          </span>
        ) : null}
      </p>
    </div>
  );

  const body = (
    <>
      <MenuListThumb imageUrl={imageUrl} />
      {textBlock}
    </>
  );

  return (
    <div
      className={[
        "flex items-stretch gap-2 sm:gap-3",
        soldOut ? "bg-zinc-50/90 dark:bg-zinc-900/40" : "",
      ].join(" ")}
    >
      {detailHref ? (
        <Link href={detailHref} className={rowBodyClass} aria-label={detailAriaLabel ?? name}>
          {body}
        </Link>
      ) : (
        <div className={rowBodyClass}>{body}</div>
      )}
      {trailing ? <div className="flex shrink-0 items-center self-center pr-1">{trailing}</div> : null}
    </div>
  );
}
