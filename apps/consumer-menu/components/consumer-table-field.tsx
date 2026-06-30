"use client";

import { useTenantTableSelection } from "@/lib/cart/use-tenant-table-selection";
import { useConsumerLocale } from "@/lib/i18n/consumer-locale-context";

type Props = {
  tenant: string;
  easyMode?: boolean;
};

/** QR 테이블 미지정·오류일 때만 안내. 정상 잠금 시 헤더에만 표시(장바구니 중복 없음). */
export function ConsumerTableField({ tenant, easyMode = false }: Props) {
  const { m } = useConsumerLocale();
  const selection = useTenantTableSelection(tenant);

  if (!selection.hasRegistry) {
    return null;
  }

  if (selection.isLocked) {
    return null;
  }

  return (
    <div
      className={
        easyMode
          ? "rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-lg font-semibold text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
          : "rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm font-semibold text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100"
      }
      role="alert"
    >
      <p>{selection.invalidQuery ? m.header.invalidTableQr : m.cart.tableQrRequired}</p>
    </div>
  );
}
