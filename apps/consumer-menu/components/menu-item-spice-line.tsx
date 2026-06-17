import { formatSpiceEmojis, shouldShowMenuSpiceForLocale } from "@/lib/menus/menu-translation-meta";
import type { AppLocale } from "@/lib/i18n/locales";

type Props = {
  spiceLevel?: number | null;
  spiceAriaLabel: string;
  locale: AppLocale;
  compact?: boolean;
};

/** 손님 메뉴 — AI 추정 맵기(🌶). 한국어(ko)에서는 표시하지 않음. */
export function MenuItemSpiceLine({ spiceLevel, spiceAriaLabel, locale, compact = false }: Props) {
  if (!shouldShowMenuSpiceForLocale(locale)) return null;

  const spiceEmojis = formatSpiceEmojis(spiceLevel);
  if (!spiceEmojis) return null;

  return (
    <div className={compact ? "mt-0.5" : "mt-2"}>
      <span
        className="text-base leading-none"
        role="img"
        aria-label={spiceAriaLabel}
        title={spiceAriaLabel}
      >
        {spiceEmojis}
      </span>
    </div>
  );
}
