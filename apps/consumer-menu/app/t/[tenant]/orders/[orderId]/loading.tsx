export default function OrderDetailLoading() {
  return (
    <div className="mx-auto max-w-lg space-y-6" aria-busy="true" aria-label="주문을 불러오는 중">
      <div className="space-y-3 text-center">
        <div className="mx-auto h-16 w-16 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
        <div className="mx-auto h-7 w-56 max-w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mx-auto h-8 w-24 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
      </div>
      <div className="h-48 animate-pulse rounded-xl border border-chaya-border bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900" />
    </div>
  );
}
