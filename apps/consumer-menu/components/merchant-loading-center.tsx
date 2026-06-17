import { ConsumerLoadingSpinner } from "@/components/consumer-loading-spinner";
import {
  merchantLoadingLabel,
  type MerchantLoadingContext,
} from "@/lib/merchant/merchant-owner-copy";

type Props = {
  context?: MerchantLoadingContext;
  label?: string;
  /** 2-pane 왼쪽 목록 등 좁은 영역 — 본문 흐름 안에서만 중앙 */
  compact?: boolean;
  className?: string;
};

const COMPACT_CLASS =
  "flex w-full flex-col items-center justify-center px-4 py-10 text-center";

/** 점주앱 — 손님앱과 동일 Lucide(포크·컵·국물) 순환 로더 */
export function MerchantLoadingCenter({
  context = "default",
  label,
  compact = false,
  className,
}: Props) {
  const text = label ?? merchantLoadingLabel(context);
  const baseClass = compact ? COMPACT_CLASS : "chaya-merchant-loading-viewport";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={text}
      className={className ? `${baseClass} ${className}` : baseClass}
    >
      <ConsumerLoadingSpinner size="lg" />
      <p className="mt-4 text-sm font-medium text-zinc-600 dark:text-zinc-400">{text}</p>
    </div>
  );
}
