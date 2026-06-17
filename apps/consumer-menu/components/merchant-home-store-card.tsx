"use client";

import { Store } from "lucide-react";

import {
  MerchantHomeCardShell,
  MerchantHomeLinkRow,
} from "@/components/merchant-home-card-shell";

type Props = {
  tenant: string;
  canManageTables: boolean;
  activeTableCount: number | null;
  tablesLoadOk: boolean;
  tablesLoadMessage?: string | null;
};

export function MerchantHomeStoreCard({
  tenant,
  canManageTables,
  activeTableCount,
  tablesLoadOk,
  tablesLoadMessage,
}: Props) {
  const t = encodeURIComponent(tenant);
  const tableLabel =
    !tablesLoadOk
      ? "불러오기 실패"
      : activeTableCount === 0
        ? "미설정"
        : activeTableCount != null
          ? `${activeTableCount}개`
          : "—";

  const summary = canManageTables ? `테이블 ${tableLabel}` : "운영 체크";

  return (
    <MerchantHomeCardShell
      title="매장 관리"
      icon={Store}
      accent="sky"
      collapsedSummary={summary}
      defaultOpen
    >
      <ul className="space-y-2">
        {canManageTables ? (
          <li>
            {!tablesLoadOk ? (
              <div
                role="alert"
                className="rounded-xl bg-amber-50 px-3 py-2.5 text-sm ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:ring-amber-800"
              >
                <p className="font-semibold text-amber-950 dark:text-amber-100">테이블 QR</p>
                <p className="mt-1 text-xs text-amber-900/90 dark:text-amber-200/90">
                  {tablesLoadMessage ?? "목록을 불러오지 못했습니다."}
                </p>
              </div>
            ) : (
              <MerchantHomeLinkRow
                label="테이블 QR"
                value={tableLabel}
                href={`/m/${t}/tables`}
                highlight={activeTableCount === 0}
                subLabel={activeTableCount === 0 ? "손님 스캔용 번호를 등록하세요" : undefined}
              />
            )}
          </li>
        ) : null}
        <li>
          <MerchantHomeLinkRow
            label="운영 체크"
            value="열기"
            href={`/m/${t}/readiness`}
            subLabel="오픈 전·점검할 일"
          />
        </li>
      </ul>
    </MerchantHomeCardShell>
  );
}
