"use client";

import { MerchantTableAddForm } from "@/components/merchant-table-add-form";
import { MerchantTableRowActions } from "@/components/merchant-table-row-actions";
import { setTenantTableActiveAction } from "@/app/m/[tenant]/tables/actions";
import { merchantSubCardClass } from "@/lib/merchant/merchant-more-sub-styles";
import { buildConsumerTableUrl } from "@/lib/tables/consumer-table-url";
import type { TenantTableRow } from "@/lib/tables/types";

type Props = {
  tenant: string;
  items: TenantTableRow[];
  listError: string | null;
  siteBase: string | null;
  canManage: boolean;
};

export function MerchantTablesManager({
  tenant,
  items,
  listError,
  siteBase,
  canManage,
}: Props) {
  const active = items.filter((t) => t.is_active);
  const inactive = items.filter((t) => !t.is_active);

  return (
    <div className="space-y-3">
      <p className="px-0.5 text-xs font-bold text-[#9CA3AF]">
        등록된 테이블 <span className="tabular-nums">{active.length}개</span>
      </p>

      <section className={merchantSubCardClass}>
        {active.length > 0 ? (
          <ul>
            {active.map((row) => {
              const url = buildConsumerTableUrl(tenant, row.table_code, siteBase);
              return (
                <li
                  key={row.id}
                  className="flex min-h-[52px] items-center gap-3 border-t border-[#F3F4F6] px-4 first:border-t-0 dark:border-zinc-800"
                >
                  <p className="flex-1 text-[15px] font-extrabold tabular-nums text-[#111827] dark:text-zinc-50">
                    테이블 {row.table_code}
                  </p>
                  <MerchantTableRowActions
                    tenant={tenant}
                    tableId={row.id}
                    tableCode={row.table_code}
                    consumerUrl={url}
                    canManage={canManage}
                  />
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-4 py-8 text-center text-sm font-medium text-[#9CA3AF]">
            {canManage ? "테이블 번호를 추가하세요." : "등록된 테이블이 없습니다."}
          </p>
        )}

        {canManage ? <MerchantTableAddForm tenant={tenant} /> : null}
      </section>

      {listError ? (
        <p role="alert" className="text-xs font-semibold text-[#B45309]">
          {listError}
        </p>
      ) : null}

      {inactive.length > 0 && canManage ? (
        <details className={merchantSubCardClass}>
          <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-[#9CA3AF]">
            숨긴 테이블 {inactive.length}개
          </summary>
          <ul className="divide-y divide-[#F3F4F6] dark:divide-zinc-800">
            {inactive.map((row) => (
              <li key={row.id} className="flex items-center justify-between px-4 py-3">
                <span className="font-bold tabular-nums">{row.table_code}</span>
                <form action={setTenantTableActiveAction}>
                  <input type="hidden" name="tenant_slug" value={tenant} />
                  <input type="hidden" name="id" value={row.id} />
                  <input type="hidden" name="is_active" value="1" />
                  <button type="submit" className="text-xs font-bold text-chaya-primary">
                    복구
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </details>
      ) : null}
    </div>
  );
}
