import Link from "next/link";

import { LOCALE_META, type AppLocale } from "@/lib/i18n/locales";

const PREVIEW_LOCALES: AppLocale[] = ["ko", "en", "ja", "zh-Hans"];

type Props = {
  tenant: string;
  className?: string;
};

/** 점주 화면에서 손님 메뉴판을 언어별로 새 탭 미리보기. */
export function MerchantConsumerPreviewLinks({ tenant, className = "" }: Props) {
  const t = encodeURIComponent(tenant);
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`.trim()}>
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">미리보기</span>
      {PREVIEW_LOCALES.map((loc) => {
        const href =
          loc === "ko" ? `/t/${t}` : `/t/${t}?lang=${encodeURIComponent(loc)}`;
        return (
          <Link
            key={loc}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            lang={loc}
            className="inline-flex min-h-[36px] items-center rounded-full border border-chaya-border px-3 py-1 text-xs font-semibold text-chaya-primary hover:bg-chaya-primary/5 dark:border-zinc-600"
          >
            {LOCALE_META[loc].shortLabel}
          </Link>
        );
      })}
    </div>
  );
}
