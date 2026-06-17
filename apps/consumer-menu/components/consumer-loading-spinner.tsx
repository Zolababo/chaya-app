import { Coffee, Soup, UtensilsCrossed, type LucideIcon } from "lucide-react";

type SpinnerSize = "sm" | "md" | "lg";

const BOX_CLASS: Record<SpinnerSize, string> = {
  sm: "size-[22px]",
  md: "size-8",
  lg: "size-10",
};

const ICON_CLASS: Record<SpinnerSize, string> = {
  sm: "size-[18px]",
  md: "size-7",
  lg: "size-9",
};

const FOOD_LOADER_ICONS: LucideIcon[] = [UtensilsCrossed, Coffee, Soup];

type Props = {
  size?: SpinnerSize;
  className?: string;
  /** 스크린리더용 — 보통 부모 `role="status"` 가 대신 읽음 */
  label?: string;
};

/** CHAYA 손님앱 — 포크·컵·국물 아이콘 순환 (레스토랑앱형) */
export function ConsumerLoadingSpinner({ size = "md", className = "", label }: Props) {
  return (
    <div
      className={`chaya-food-loader-cycle ${BOX_CLASS[size]} ${className}`.trim()}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
    >
      {FOOD_LOADER_ICONS.map((Icon, index) => (
        <span
          key={index}
          className="chaya-food-loader-icon text-chaya-primary dark:text-orange-400"
          aria-hidden
        >
          <Icon className={ICON_CLASS[size]} strokeWidth={2} />
        </span>
      ))}
    </div>
  );
}
