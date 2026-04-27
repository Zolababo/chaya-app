"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { persistTablePrefFromQuery } from "@/lib/cart/table-pref";

type Props = {
  tenant: string;
};

/** `/t/{tenant}?table=…` 를 로컬에 두어 장바구니·주문 폼과 맞춥니다. */
export function TenantTableQuerySync({ tenant }: Props) {
  const searchParams = useSearchParams();
  const raw = searchParams.get("table");

  useEffect(() => {
    persistTablePrefFromQuery(tenant, raw === null ? null : raw);
  }, [tenant, raw]);

  return null;
}
