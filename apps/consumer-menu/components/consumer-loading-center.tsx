import { ConsumerLoadingSpinner } from "@/components/consumer-loading-spinner";

type Props = {
  /** 접근성·화면 표시용 (예: 불러오는 중…) */
  label: string;
  easyMode?: boolean;
  /** 기본: 탭 콘텐츠 영역 세로 중앙 */
  className?: string;
};

/** 손님 탭·페이지 전환 시 가운데 스피너 + 문구 */
export function ConsumerLoadingCenter({ label, easyMode = false, className }: Props) {
  const baseClass =
    "flex min-h-[calc(100dvh-11rem)] w-full flex-col items-center justify-center px-4 text-center";

  return (
    <div
      className={className ? `${baseClass} ${className}` : baseClass}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <ConsumerLoadingSpinner size="lg" />
      <p
        className={`mt-4 text-zinc-600 dark:text-zinc-400 ${
          easyMode ? "text-lg font-semibold" : "text-sm font-medium"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
