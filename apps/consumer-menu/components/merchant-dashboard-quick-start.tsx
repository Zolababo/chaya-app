import Link from "next/link";

import { chayaSurfaceCardPaddedClass } from "@/components/menu-list-styles";

type Props = {
  tenant: string;
  pendingCount: number | null;
  canManageMenus: boolean;
};

export function MerchantDashboardQuickStart({
  tenant,
  pendingCount,
  canManageMenus,
}: Props) {
  const t = encodeURIComponent(tenant);
  const showPending = typeof pendingCount === "number" && pendingCount > 0;

  return (
    <section className={`mb-8 ${chayaSurfaceCardPaddedClass}`} aria-label="바로가기">
      <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">바로가기</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        <li>
          <Link
            href={`/m/${t}/orders${showPending ? "?status=pending" : ""}`}
            className="flex min-h-[56px] flex-col justify-center rounded-xl border-2 border-chaya-primary bg-chaya-primary/5 px-4 py-3 font-semibold text-chaya-primary transition hover:bg-chaya-primary/10 dark:border-orange-500 dark:text-orange-400"
          >
            <span className="text-base">주문 큐</span>
            <span className="mt-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {showPending ? `대기 ${pendingCount}건 — 지금 확인` : "접수·조리 상태 변경"}
            </span>
          </Link>
        </li>
        {canManageMenus ? (
          <li>
            <Link
              href={`/m/${t}/menus`}
              className="flex min-h-[56px] flex-col justify-center rounded-xl border border-chaya-border bg-white px-4 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
            >
              <span className="text-base">메뉴 관리</span>
              <span className="mt-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
                가격·품절·사진
              </span>
            </Link>
          </li>
        ) : null}
        <li>
          <Link
            href={`/t/${t}`}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[56px] flex-col justify-center rounded-xl border border-dashed border-chaya-border px-4 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            <span className="text-base">손님 메뉴 미리보기</span>
            <span className="mt-0.5 text-xs font-medium text-zinc-500">새 탭에서 열림</span>
          </Link>
        </li>
        <li>
          <Link
            href={`/m/${t}/more`}
            className="flex min-h-[56px] flex-col justify-center rounded-xl border border-chaya-border bg-white px-4 py-3 font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
          >
            <span className="text-base">더보기</span>
            <span className="mt-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              테이블 QR · 운영 체크 · 실적
            </span>
          </Link>
        </li>
      </ul>
    </section>
  );
}
