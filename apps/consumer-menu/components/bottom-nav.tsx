"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  tenant: string;
};

export function BottomNav({ tenant }: Props) {
  const pathname = usePathname();
  const base = `/t/${tenant}`;

  const onMenu = pathname === base || pathname === `${base}/`;
  const onCart = pathname.startsWith(`${base}/cart`);
  const onOrders = pathname.includes(`${base}/orders`);

  const itemClass = (active: boolean) =>
    [
      "flex min-h-[56px] min-w-[72px] flex-col items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
      active
        ? "bg-orange-700 text-white"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
    ].join(" ");

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t-2 border-zinc-200 bg-white pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="주요 메뉴"
    >
      <Link href={base} className={itemClass(onMenu)} aria-current={onMenu ? "page" : undefined}>
        <span aria-hidden>🍽</span>
        <span>Menu</span>
      </Link>
      <Link
        href={`${base}/cart`}
        className={itemClass(onCart)}
        aria-current={onCart ? "page" : undefined}
      >
        <span aria-hidden>🛒</span>
        <span>Cart</span>
      </Link>
      <Link
        href={`${base}/orders/demo`}
        className={itemClass(onOrders)}
        aria-current={onOrders ? "page" : undefined}
      >
        <span aria-hidden>📋</span>
        <span>Order Status</span>
      </Link>
    </nav>
  );
}
