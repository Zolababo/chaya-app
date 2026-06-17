/** 가로 2-pane — 선택 전·목록 비었을 때 오른쪽 패널 */
export function MerchantOrdersDetailEmpty() {
  return (
    <div
      className="flex min-h-[12rem] flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-10 text-center dark:border-zinc-700 dark:bg-zinc-900/40"
      aria-hidden
    >
      <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">주문을 선택하세요</p>
      <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
        왼쪽 목록에서 주문을 누르면 상세와 처리 버튼이 표시됩니다.
      </p>
    </div>
  );
}
