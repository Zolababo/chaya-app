type Props = {
  displayName: string;
  logoUrl?: string | null;
  /** Tailwind size classes for logo image (default `h-11 w-11`). */
  sizeClass?: string;
  /** 손님 헤더=원형, 점주 설정 미리보기=둥근 사각 */
  shape?: "circle" | "rounded";
  /**
   * 로고 없을 때 — `wordmark`: 업소명 강조 텍스트(로고 자리 대체)
   * `initial`: 이니셜 1글자(작은 자리)
   */
  fallback?: "wordmark" | "initial";
  /** 워드마크 스타일 — `brand`: 솔리드 브랜드 컬러 */
  tone?: "soft" | "brand";
  /** 워드마크 크기 */
  wordmarkSize?: "sm" | "md" | "lg";
  className?: string;
};

function storeLabel(name: string): string {
  return name.trim() || "매장";
}

/** 매장 로고 또는 업소명 워드마크 (로고·워드마크 중 하나만). */
export function ConsumerStoreLogo({
  displayName,
  logoUrl,
  sizeClass = "h-11 w-11",
  shape = "circle",
  fallback = "wordmark",
  tone = "brand",
  wordmarkSize = "md",
  className = "",
}: Props) {
  const label = storeLabel(displayName);
  const radius = shape === "rounded" ? "rounded-[14px]" : "rounded-full";
  const compact = sizeClass.includes("h-9") || sizeClass.includes("h-8");

  if (logoUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={`${sizeClass} shrink-0 ${radius} object-cover ring-2 ring-white shadow-md ring-chaya-primary/15 dark:ring-zinc-800 ${className}`}
      />
    );
  }

  if (fallback === "initial") {
    const initial = label.charAt(0).toUpperCase();
    const textSize =
      sizeClass.includes("h-12") || sizeClass.includes("h-14") ? "text-xl font-black" : "text-lg font-semibold";
    return (
      <div
        className={`flex ${sizeClass} shrink-0 items-center justify-center ${radius} bg-chaya-primary ${textSize} text-white shadow-md shadow-chaya-primary/30 ${className}`}
        aria-hidden
      >
        {initial}
      </div>
    );
  }

  const resolvedSize = compact ? "sm" : wordmarkSize;
  const wordmarkRadius =
    shape === "rounded"
      ? resolvedSize === "lg"
        ? "rounded-2xl"
        : "rounded-xl"
      : resolvedSize === "lg"
        ? "rounded-2xl"
        : "rounded-xl";

  const brandShell =
    tone === "brand"
      ? [
          "bg-chaya-primary text-white shadow-md shadow-chaya-primary/30",
          resolvedSize === "lg"
            ? "px-4 py-2.5 sm:px-5 sm:py-3"
            : resolvedSize === "sm"
              ? "px-2.5 py-1.5"
              : "px-3.5 py-2",
        ].join(" ")
      : [
          "border border-[#F5D0C5]/90 bg-gradient-to-br from-[#FEF0EB] to-[#FFE8DC] text-chaya-primary",
          "dark:border-orange-900/50 dark:from-orange-950/50 dark:to-orange-900/30 dark:text-orange-300",
          resolvedSize === "lg" ? "px-4 py-2.5" : "px-3 py-1.5",
        ].join(" ");

  const textClass =
    tone === "brand"
      ? [
          "truncate font-black tracking-tight text-white",
          resolvedSize === "lg"
            ? "text-lg leading-tight sm:text-[1.35rem]"
            : resolvedSize === "sm"
              ? "text-[13px] leading-tight"
              : "text-base leading-tight sm:text-lg",
        ].join(" ")
      : [
          "truncate font-extrabold leading-tight",
          resolvedSize === "lg" ? "text-base sm:text-lg" : "text-sm sm:text-[15px]",
        ].join(" ");

  return (
    <div
      className={[
        "inline-flex max-w-full min-w-0 items-center",
        wordmarkRadius,
        brandShell,
        className,
      ].join(" ")}
      aria-label={label}
    >
      <span className={textClass}>{label}</span>
    </div>
  );
}

/** 로고 URL이 있으면 true — 헤더에서 매장명 중복 노출 여부 판단용 */
export function hasStoreLogo(logoUrl?: string | null): boolean {
  return Boolean(logoUrl?.trim());
}

type TableBadgeProps = {
  /** 예: "테이블 5" */
  label: string;
  /** 테이블 번호만 강조할 때 */
  tableCode?: string | null;
  className?: string;
  /** 헤더 한 줄 — 회색 알약 칩 */
  variant?: "default" | "inline";
};

/** 손님 헤더 — 테이블 번호 (한 줄 레이아웃용 컴팩트 칩) */
export function ConsumerTableBadge({
  label,
  tableCode,
  className = "",
  variant = "default",
}: TableBadgeProps) {
  const code = tableCode?.trim();

  if (variant === "inline" && code) {
    const text = label.trim() || `테이블 ${code}`;
    return (
      <span
        className={[
          "inline-flex shrink-0 items-center rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600",
          "dark:bg-zinc-800 dark:text-zinc-300",
          className,
        ].join(" ")}
        aria-live="polite"
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={[
        "inline-flex max-w-full min-w-0 items-center gap-2 rounded-xl border-2 border-chaya-primary/35 bg-white px-3 py-1.5 shadow-sm",
        "dark:border-orange-500/50 dark:bg-zinc-900",
        className,
      ].join(" ")}
      aria-live="polite"
    >
      {code ? (
        <>
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-chaya-primary/80 dark:text-orange-400/80">
            테이블
          </span>
          <span className="truncate text-lg font-black tabular-nums leading-none text-chaya-primary dark:text-orange-400">
            {code}
          </span>
        </>
      ) : (
        <span className="truncate text-sm font-extrabold text-chaya-primary dark:text-orange-400">{label}</span>
      )}
    </span>
  );
}
