import Link from "next/link";

type Props = {
  tenant: string;
  /** `pending` 주문 건수(헤더·서브내비에서 동일하게 넘김). 없으면 뱃지 생략. */
  pendingOrderCount?: number | null;
  /** 기본값 true. `staff` 역할이면 메뉴 관리 링크를 숨길 때 false. */
  canManageMenus?: boolean;
};

export function MerchantSubnav({ tenant, pendingOrderCount, canManageMenus = true }: Props) {
  const t = encodeURIComponent(tenant);
  const showPending =
    typeof pendingOrderCount === "number" && pendingOrderCount > 0 ? pendingOrderCount : null;

  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-3 border-b border-chaya-border pb-3 text-sm font-semibold dark:border-zinc-700"
      aria-label="점주 메뉴"
    >
      <Link
        href={`/m/${t}/dashboard`}
        className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        대시보드
      </Link>
      <Link
        href={`/m/${t}/orders`}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <span>주문 큐</span>
        {showPending != null ? (
          <span
            className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white tabular-nums dark:bg-red-500"
            aria-label={`대기 중인 주문 ${showPending}건`}
          >
            {showPending}
          </span>
        ) : null}
      </Link>
      <Link
        href={`/m/${t}/audit`}
        className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        활동 기록
      </Link>
      {canManageMenus ? (
        <Link
          href={`/m/${t}/menus`}
          className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          메뉴 관리
        </Link>
      ) : null}
      <Link
        href={`/m/${t}/analytics`}
        className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        기간 실적
      </Link>
      <Link
        href={`/m/${t}/categories`}
        className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        카테고리
      </Link>
      <Link
        href={`/m/${t}/readiness`}
        className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        운영 체크
      </Link>
      <form action="/m/logout" method="post" className="ml-auto">
        <button
          type="submit"
          className="inline-flex min-h-[44px] items-center rounded-lg px-3 py-2 text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-500"
          aria-label="점주 세션 로그아웃"
        >
          로그아웃
        </button>
      </form>
    </nav>
  );
}
