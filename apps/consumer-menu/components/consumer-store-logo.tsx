type Props = {
  displayName: string;
  logoUrl?: string | null;
};

/** 매장 로고 또는 이니셜 플레이스홀더 (장식 — 매장명은 옆 텍스트). */
export function ConsumerStoreLogo({ displayName, logoUrl }: Props) {
  const label = displayName.trim() || "Store";
  const initial = label.charAt(0).toUpperCase();

  if (logoUrl?.trim()) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt=""
        className="h-11 w-11 shrink-0 rounded-xl object-cover ring-1 ring-chaya-border/80 dark:ring-zinc-700"
      />
    );
  }

  return (
    <div
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-chaya-primary/12 text-lg font-bold text-chaya-primary ring-1 ring-chaya-primary/20 dark:bg-orange-950/40 dark:text-orange-300 dark:ring-orange-900/50"
      aria-hidden
    >
      {initial}
    </div>
  );
}
