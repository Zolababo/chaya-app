export default function TenantMenuLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="메뉴를 불러오는 중">
      <div className="h-4 w-3/4 max-w-md animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-3xl border border-chaya-border bg-chaya-surface dark:border-zinc-700 dark:bg-zinc-950"
          >
            <div className="h-40 animate-pulse bg-zinc-200 dark:bg-zinc-800" />
            <div className="space-y-2 p-4">
              <div className="h-5 w-4/5 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="h-4 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-4 flex justify-between gap-2">
                <div className="h-10 w-20 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
                <div className="h-10 w-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
