"use client";

import { MerchantSettingsBreakInline } from "@/components/merchant-settings-break-inline";
import { MerchantSettingsBusinessHoursInline } from "@/components/merchant-settings-business-hours-inline";
import { MerchantSettingsOrdersToggle } from "@/components/merchant-settings-orders-toggle";
import {
  merchantSubCardBodyClass,
  merchantSubCardClass,
} from "@/lib/merchant/merchant-more-sub-styles";
import type { TenantStoreSettings } from "@/lib/tenant/tenant-store-settings";

type Props = {
  tenant: string;
  settings: TenantStoreSettings;
  canEdit: boolean;
  /** 더보기 허브 아코디언 안 — 바깥 카드 없음 */
  embedded?: boolean;
};

export function MerchantHoursSettingsPanel({ tenant, settings, canEdit, embedded }: Props) {
  const accepting = settings.ordersAccepting;

  const body = (
      <div className={embedded ? "flex flex-col gap-3.5" : merchantSubCardBodyClass}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[#111827] dark:text-zinc-50">주문 받기</p>
            <p className="text-xs font-medium text-[#9CA3AF]">
              {accepting ? "현재 영업중이에요" : "현재 영업 종료 상태예요"}
            </p>
          </div>
          <MerchantSettingsOrdersToggle
            tenant={tenant}
            ordersAccepting={accepting}
            canEdit={canEdit}
            showBadge={false}
          />
        </div>

        <MerchantSettingsBusinessHoursInline
          tenant={tenant}
          businessOpen={settings.businessOpen}
          businessClose={settings.businessClose}
          salesDayCutoff={settings.salesDayCutoff}
          canEdit={canEdit}
        />

        <MerchantSettingsBreakInline
          tenant={tenant}
          breakStart={settings.breakStart}
          breakEnd={settings.breakEnd}
          canEdit={canEdit}
        />
      </div>
  );

  if (embedded) {
    return <div aria-label="영업 설정">{body}</div>;
  }

  return (
    <section className={merchantSubCardClass} aria-label="영업 설정">
      {body}
    </section>
  );
}
