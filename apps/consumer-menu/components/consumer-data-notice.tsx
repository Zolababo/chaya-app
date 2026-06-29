import type { AppLocale } from "@/lib/i18n/locales";
import { consumerMessages } from "@/lib/i18n/consumer-messages";

type Props = {
  locale: AppLocale;
};

/** 손님 화면 하단 — 익명 세션·이용 데이터 수집 목적 안내. */
export function ConsumerDataNotice({ locale }: Props) {
  const m = consumerMessages(locale);
  return (
    <p
      className="mt-4 border-t border-chaya-border/50 pt-3 text-center text-[11px] leading-relaxed text-zinc-400"
      role="note"
    >
      {m.footer.dataNotice}
    </p>
  );
}
