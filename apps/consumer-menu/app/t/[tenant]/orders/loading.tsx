export default function OrdersListLoading() {
  return (
    <div
      className="mx-auto max-w-md space-y-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="주문 내역을 불러오는 중"
    >
      <div className="space-y-2 text-center">
        <div className="mx-auto h-8 w-48 max-w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mx-auto h-4 w-72 max-w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-32 animate-pulse rounded-xl border border-chaya-border bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
    </div>
  );
}
