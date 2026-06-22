type Props = {
  /** 접근성 라벨 (예: 로그인, 회원가입) */
  label?: string;
};

const block = "animate-pulse rounded-md bg-zinc-200/90";

/** login·signup — 헤더·폼 윤곽만 (ConsumerLoadingCenter 대체) */
export function ConsumerAuthPageSkeleton({ label = "불러오는 중" }: Props) {
  return (
    <div className="space-y-6 py-8" role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <div className="space-y-2 text-center">
        <div className={`mx-auto h-7 w-24 ${block}`} />
        <div className={`mx-auto h-4 w-56 max-w-full ${block}`} />
      </div>

      <div className="space-y-4 rounded-xl border border-chaya-border/60 bg-chaya-surface p-6 shadow-sm">
        <div className="space-y-2">
          <div className={`h-3 w-12 ${block}`} />
          <div className={`h-11 w-full rounded-xl ${block}`} />
        </div>
        <div className="space-y-2">
          <div className={`h-3 w-14 ${block}`} />
          <div className={`h-11 w-full rounded-xl ${block}`} />
        </div>
        <div className={`h-12 w-full rounded-xl ${block}`} />
      </div>

      <div className={`mx-auto h-4 w-40 ${block}`} />
    </div>
  );
}
