"use client";

import { UtensilsCrossed } from "lucide-react";

import {
  MerchantHomeCardShell,
  MerchantHomeLinkRow,
} from "@/components/merchant-home-card-shell";
import { merchantMenusHref } from "@/lib/merchant/merchant-menus-href";

type Props = {
  tenant: string;
  sellingCount: number;
  soldOutCount: number;
};

export function MerchantHomeMenuMgmtCard({ tenant, sellingCount, soldOutCount }: Props) {
  const summary = `판매 ${sellingCount} · 품절 ${soldOutCount}`;

  return (
    <MerchantHomeCardShell
      title="메뉴 관리"
      icon={UtensilsCrossed}
      accent="amber"
      collapsedSummary={summary}
      defaultOpen
    >
      <ul className="space-y-2">
        <li>
          <MerchantHomeLinkRow
            label="판매중"
            value={`${sellingCount}개`}
            href={merchantMenusHref(tenant)}
          />
        </li>
        <li>
          <MerchantHomeLinkRow
            label="품절"
            value={`${soldOutCount}개`}
            href={merchantMenusHref(tenant, { soldOutOnly: true })}
            highlight={soldOutCount > 0}
          />
        </li>
      </ul>
    </MerchantHomeCardShell>
  );
}
