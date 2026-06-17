import { ConsumerLoadingCenter } from "@/components/consumer-loading-center";
import { consumerMessages } from "@/lib/i18n/consumer-messages";
import { getConsumerLocale } from "@/lib/i18n/get-consumer-locale";

export default async function CartLoading() {
  const locale = await getConsumerLocale();
  const m = consumerMessages(locale);

  return <ConsumerLoadingCenter label={m.cart.loading} />;
}
