import { consumerMessages } from "./consumer-messages";
import type { AppLocale } from "./locales";

export function orderStatusLabelForLocale(code: string, locale: AppLocale): string {
  const labels = consumerMessages(locale).status;
  const key = code as keyof typeof labels;
  return labels[key] ?? code;
}
