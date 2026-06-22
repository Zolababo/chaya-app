const block = "animate-pulse rounded-md bg-zinc-200/90";

/** barrier-free — 카테고리 칩 + 메뉴 행 윤곽 */
export function ConsumerBarrierFreePageSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-busy="true" aria-label="메뉴 불러오는 중">
      <div className="flex gap-2 overflow-hidden pb-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-9 w-16 shrink-0 rounded-full ${block}`} />
        ))}
      </div>

      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3 rounded-xl border border-chaya-border/60 bg-chaya-surface p-3 shadow-sm"
        >
          <div className={`h-16 w-16 shrink-0 rounded-xl ${block}`} />
          <div className="min-w-0 flex-1 space-y-2 py-0.5">
            <div className={`h-5 w-[58%] ${block}`} />
            <div className={`h-6 w-24 ${block}`} />
            <div className={`h-11 w-full rounded-xl ${block}`} />
          </div>
        </div>
      ))}
    </div>
  );
}
