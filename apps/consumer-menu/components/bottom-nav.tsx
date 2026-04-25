"use client";

import { ClipboardList, Menu, ShoppingCart } from "lucide-react";
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
  const onOrders = pathname.startsWith(`${base}/orders`);

  const itemClass = (active: boolean) =>
    [
      "flex min-h-[56px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl px-4 py-2 text-xs font-semibold tracking-wide transition-colors",
      active
        ? "bg-chaya-primary text-chaya-on-primary shadow-sm"
        : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800",
    ].join(" ");

  const iconClass = (active: boolean) => (active ? "text-chaya-on-primary" : "text-zinc-500 dark:text-zinc-400");

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 flex w-full justify-around border-t border-chaya-border bg-chaya-surface pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:border-zinc-800 dark:bg-zinc-950"
      aria-label="주요 메뉴"
    >
      <Link href={base} className={itemClass(onMenu)} aria-current={onMenu ? "page" : undefined}>
        <Menu className={`size-6 ${iconClass(onMenu)}`} aria-hidden strokeWidth={2} />
        <span>Menu</span>
      </Link>
      <Link
        href={`${base}/cart`}
        className={itemClass(onCart)}
        aria-current={onCart ? "page" : undefined}
      >
        <ShoppingCart className={`size-6 ${iconClass(onCart)}`} aria-hidden strokeWidth={2} />
        <span>Cart</span>
      </Link>
      <Link
        href={`${base}/orders`}
        className={itemClass(onOrders)}
        aria-current={onOrders ? "page" : undefined}
      >
        <ClipboardList className={`size-6 ${iconClass(onOrders)}`} aria-hidden strokeWidth={2} />
        <span>Order Status</span>
      </Link>
    </nav>
  );
}
