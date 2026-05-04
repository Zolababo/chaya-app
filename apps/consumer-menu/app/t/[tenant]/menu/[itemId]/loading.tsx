export default function MenuItemLoading() {
  return (
    <div
      className="mx-auto max-w-lg space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="메뉴 상세를 불러오는 중"
    >
      <div className="aspect-[4/3] w-full animate-pulse rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
      <div className="space-y-3">
        <div className="h-8 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-20 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-14 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
