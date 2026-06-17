import type { LucideIcon } from "lucide-react";
import { CheckCircle2, ChefHat, Clock, XCircle } from "lucide-react";

export type OrderStatusVisual = {
  bannerClass: string;
  textClass: string;
  Icon: LucideIcon;
};

const ACTIVE = new Set(["pending", "accepted", "preparing", "ready"]);

export function isActiveOrderStatus(status: string): boolean {
  return ACTIVE.has(status.trim().toLowerCase());
}

export function orderStatusVisual(status: string): OrderStatusVisual {
  const s = status.trim().toLowerCase();
  switch (s) {
    case "preparing":
      return {
        bannerClass: "bg-amber-50 dark:bg-amber-950/35",
        textClass: "text-amber-900 dark:text-amber-100",
        Icon: ChefHat,
      };
    case "ready":
      return {
        bannerClass: "bg-rose-50 dark:bg-rose-950/35",
        textClass: "text-rose-900 dark:text-rose-100",
        Icon: CheckCircle2,
      };
    case "completed":
      return {
        bannerClass: "bg-zinc-100 dark:bg-zinc-800/80",
        textClass: "text-zinc-600 dark:text-zinc-300",
        Icon: CheckCircle2,
      };
    case "cancelled":
      return {
        bannerClass: "bg-red-50 dark:bg-red-950/30",
        textClass: "text-red-800 dark:text-red-200",
        Icon: XCircle,
      };
    case "accepted":
      return {
        bannerClass: "bg-chaya-primary/10 dark:bg-orange-950/40",
        textClass: "text-chaya-primary dark:text-orange-300",
        Icon: Clock,
      };
    default:
      return {
        bannerClass: "bg-chaya-primary/8 dark:bg-orange-950/30",
        textClass: "text-chaya-primary dark:text-orange-300",
        Icon: Clock,
      };
  }
}
