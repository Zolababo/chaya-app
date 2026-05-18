/** useSearchParams 대기 시 레이아웃 밀림 방지용 최소 높이 */
export function SessionHeaderFallback() {
  return (
    <div
      className="sticky top-0 z-40 h-[4.25rem] w-full border-b border-chaya-border bg-chaya-surface dark:border-zinc-800 dark:bg-zinc-950"
      aria-hidden
    />
  );
}
