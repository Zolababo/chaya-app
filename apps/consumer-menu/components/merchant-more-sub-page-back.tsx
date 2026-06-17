import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { merchantSubCardClass } from "@/lib/merchant/merchant-more-sub-styles";

type Props = {
  href: string;
  label?: string;
};

/** 서브 상단 — 아래 카드와 동일한 라운드 카드 */
export function MerchantMoreSubPageBack({ href, label = "더보기" }: Props) {
  return (
    <div
      className={`${merchantSubCardClass} mb-3 flex min-h-[52px] items-center gap-1 px-4 py-2.5`}
    >
      <Link
        href={href}
        className="inline-flex items-center text-[22px] font-bold leading-none text-chaya-primary transition active:opacity-70"
        aria-label={`${label}으로 돌아가기`}
      >
        <ChevronLeft className="h-6 w-6 shrink-0" strokeWidth={2.5} aria-hidden />
      </Link>
      <span className="text-[17px] font-extrabold text-[#111827] dark:text-zinc-50">{label}</span>
    </div>
  );
}
