"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { toggleMerchantOrdersAcceptingInline } from "@/app/m/[tenant]/more/actions";
import {
  MerchantSettingsBadge,
  MerchantSettingsToggle,
} from "@/components/merchant-settings-sheet-ui";

type Props = {
  tenant: string;
  ordersAccepting: boolean;
  canEdit: boolean;
  /** 영업 카드 안에서는 뱃지 생략(상태 텍스트만) */
  showBadge?: boolean;
};

export function MerchantSettingsOrdersToggle({
  tenant,
  ordersAccepting,
  canEdit,
  showBadge = true,
}: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(ordersAccepting);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setAccepting(ordersAccepting);
  }, [ordersAccepting]);

  const toggle = () => {
    if (!canEdit || pending) return;
    const next = !accepting;
    setAccepting(next);
    const fd = new FormData();
    fd.set("tenant_slug", tenant);
    fd.set("next_accepting", next ? "true" : "false");
    startTransition(async () => {
      const result = await toggleMerchantOrdersAcceptingInline(fd);
      if (!result.ok) {
        setAccepting(!next);
        return;
      }
      setAccepting(result.accepting);
      router.refresh();
    });
  };

  return (
    <>
      {showBadge ? (
        <MerchantSettingsBadge tone={accepting ? "open" : "closed"}>
          {accepting ? "영업중" : "영업종료"}
        </MerchantSettingsBadge>
      ) : null}
      <MerchantSettingsToggle
        on={accepting}
        onToggle={toggle}
        disabled={!canEdit || pending}
        ariaLabel="영업 상태"
      />
    </>
  );
}
