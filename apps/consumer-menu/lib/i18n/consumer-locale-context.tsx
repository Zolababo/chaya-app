"use client";

import { useSearchParams } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";

import { consumerMessages } from "./consumer-messages";
import type { AppLocale } from "./locales";
import { DEFAULT_LOCALE, parseAppLocale } from "./locales";
import { readConsumerLocaleCookieClient } from "./read-consumer-locale-cookie";
import { setConsumerLocaleCookieClient } from "./set-consumer-locale-cookie";

type ConsumerLocaleContextValue = {
  locale: AppLocale;
  m: ReturnType<typeof consumerMessages>;
};

const ConsumerLocaleContext = createContext<ConsumerLocaleContextValue>({
  locale: DEFAULT_LOCALE,
  m: consumerMessages(DEFAULT_LOCALE),
});

export function ConsumerLocaleProvider({
  locale: serverLocale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const fromUrl = searchParams.get("lang");
    if (fromUrl) setConsumerLocaleCookieClient(parseAppLocale(fromUrl));
  }, [searchParams]);

  const locale = useMemo(() => {
    const fromUrl = searchParams.get("lang");
    if (fromUrl) return parseAppLocale(fromUrl);
    const fromCookie = readConsumerLocaleCookieClient();
    if (fromCookie) return fromCookie;
    return serverLocale;
  }, [searchParams, serverLocale]);

  const value = useMemo(
    () => ({ locale, m: consumerMessages(locale) }),
    [locale],
  );

  return <ConsumerLocaleContext.Provider value={value}>{children}</ConsumerLocaleContext.Provider>;
}

export function useConsumerLocale(): ConsumerLocaleContextValue {
  return useContext(ConsumerLocaleContext);
}
