export default function CartLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="장바구니를 불러오는 중">
      <div className="h-8 w-48 max-w-full animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-4 w-full max-w-xl animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="h-40 animate-pulse rounded-xl border border-chaya-border bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900" />
      <div className="h-14 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}
