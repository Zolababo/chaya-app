import Link from "next/link";

type Props = {
  tenant: string;
};

export function MerchantSubnav({ tenant }: Props) {
  const t = encodeURIComponent(tenant);

  return (
    <nav
      className="mb-6 flex flex-wrap items-center gap-3 border-b border-chaya-border pb-3 text-sm font-semibold dark:border-zinc-700"
      aria-label="점주 메뉴"
    >
      <Link
        href={`/m/${t}/orders`}
        className="rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        주문 큐
      </Link>
      <Link
        href={`/m/${t}/menus`}
        className="rounded-lg px-3 py-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        메뉴 관리
      </Link>
      <Link
        href="/m/logout"
        className="ml-auto rounded-lg px-3 py-2 text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-500"
      >
        로그아웃
      </Link>
    </nav>
  );
}
