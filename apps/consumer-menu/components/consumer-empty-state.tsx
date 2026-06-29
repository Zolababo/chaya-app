import type { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  message: string;
  action?: ReactNode;
  easyMode?: boolean;
};

/** 장바구니·주문 등 손님 탭 빈 화면 — 아이콘 + 문구 가운데 정렬 */
export function ConsumerEmptyState({ icon, message, action, easyMode = false }: Props) {
  return (
    <div className="flex min-h-[calc(100dvh-11rem)] flex-col items-center justify-center px-4 text-center">
      <div
        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800"
        aria-hidden
      >
        {icon}
      </div>
      <p
        className={`text-zinc-600 dark:text-zinc-400 ${
          easyMode ? "text-lg font-semibold" : "text-sm font-medium"
        }`}
      >
        {message}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
