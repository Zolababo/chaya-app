"use client";

import { useOptimistic, useTransition } from "react";
import { setMenuSoldOutFromForm } from "@/app/m/[tenant]/menus/actions";
import { invalidateMerchantCacheForTenant } from "@/lib/merchant/merchant-client-cache";

type Props = {
  tenant: string;
  menuId: string;
  isSoldOut: boolean;
};

export function MerchantMenuSoldOutToggle({ tenant, menuId, isSoldOut }: Props) {
  const [optimistic, addOptimistic] = useOptimistic(
    isSoldOut,
    (_: boolean, next: boolean) => next,
  );
  const [pending, startTransition] = useTransition();

  function handleClick() {
    const next = !optimistic;
    startTransition(async () => {
      addOptimistic(next);
      const fd = new FormData();
      fd.set("tenant_slug", tenant);
      fd.set("menu_id", menuId);
      fd.set("is_sold_out", String(next));
      await setMenuSoldOutFromForm(fd);
      invalidateMerchantCacheForTenant(tenant, "menus");
    });
  }

  // 품절(isSoldOut)이 경고 상태 → RED
  // 판매중(!isSoldOut)이 정상 상태 → neutral gray

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="flex shrink-0 flex-col items-center gap-1 p-1 disabled:opacity-60"
      aria-label={optimistic ? "품절 해제 (판매 재개)" : "품절 처리"}
    >
      {/* 토글 스위치 */}
      <div
        className={[
          "relative h-7 w-12 rounded-full transition-colors duration-200",
          optimistic
            ? "bg-red-500"             /* 품절 = 빨간 경고 */
            : "bg-emerald-400",        /* 판매중 = 옅은 녹색 */
        ].join(" ")}
      >
        <div
          className={[
            "absolute top-[3px] h-[22px] w-[22px] rounded-full bg-white shadow transition-all duration-200",
            optimistic ? "left-[3px]" : "left-[23px]",
          ].join(" ")}
        />
      </div>
      {/* 레이블 */}
      <span
        className={[
          "text-[10px] font-bold",
          optimistic
            ? "text-red-600 dark:text-red-400"       /* 품절 강조 */
            : "text-emerald-600 dark:text-emerald-400", /* 판매중 옅은 녹색 */
        ].join(" ")}
      >
        {optimistic ? "품절" : "판매중"}
      </span>
    </button>
  );
}
