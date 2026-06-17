type Props = {
  displayName: string;
  logoUrl?: string | null;
  /** Tailwind size classes (default `h-11 w-11`). */
  sizeClass?: string;
  /** 손님 헤더=원형, 점주 설정 미리보기=둥근 사각 */
  shape?: "circle" | "rounded";
};

/** 매장 로고 또는 이니셜 플레이스홀더 (장식 — 매장명은 옆 텍스트). */
export function ConsumerStoreLogo({
  displayName,
  logoUrl,
  sizeClass = "h-11 w-11",
  shape = "circle",
}: Props) {
  const label = displayName.trim() || "Store";
  const initial = label.charAt(0).toUpperCase();
  const textSize =
    sizeClass.includes("h-12") || sizeClass.includes("h-14") ? "text-xl font-black" : "text-lg font-semibold";
  const radius = shape === "rounded" ? "rounded-[14px]" : "rounded-full";

  if (logoUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className={`${sizeClass} shrink-0 ${radius} object-cover ring-1 ring-[#E5E7EB] dark:ring-zinc-700`}
      />
    );
  }

  return (
    <div
      className={`flex ${sizeClass} shrink-0 items-center justify-center ${radius} bg-[#FEF0EB] ${textSize} text-chaya-primary dark:bg-orange-950/40 dark:text-orange-300`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
