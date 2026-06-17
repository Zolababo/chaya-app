import type { MenuItemBadge, MenuItemBadgeKind } from "@/lib/menus/menu-item-badges";

const BADGE_CLASS: Record<MenuItemBadgeKind, string> = {
  featured:
    "bg-chaya-primary text-chaya-on-primary shadow-sm dark:bg-orange-700 dark:text-white",
  popular: "bg-orange-600 text-white shadow-sm dark:bg-orange-700",
  new: "bg-emerald-600 text-white shadow-sm dark:bg-emerald-700",
};

type Props = {
  badges: MenuItemBadge[];
};

export function MenuItemBadgeStrip({ badges }: Props) {
  if (badges.length === 0) return null;

  return (
    <div className="pointer-events-none absolute left-2 top-2 z-10 flex flex-wrap gap-1" aria-hidden>
      {badges.map((b) => (
        <span
          key={b.kind}
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tracking-wide ${BADGE_CLASS[b.kind]}`}
        >
          {b.label}
        </span>
      ))}
    </div>
  );
}
