type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function CartPage({ params }: Props) {
  const { tenant } = await params;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">주문 확인</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          장바구니 라인·요약·더치페이는 다음 단계에서 연결합니다.
        </p>
      </div>

      <div className="rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-sm text-zinc-500">테넌트: {tenant}</p>
        <p className="mt-2 font-medium">CartLineItem · OrderSummary · SplitBillPanel</p>
      </div>

      <button
        type="button"
        className="w-full rounded-2xl bg-chaya-primary py-4 text-lg font-bold text-chaya-on-primary opacity-90"
        disabled
      >
        SEND ORDER TO KITCHEN (준비 중)
      </button>
    </div>
  );
}
