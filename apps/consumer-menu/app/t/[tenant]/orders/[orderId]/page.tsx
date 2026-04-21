type Props = {
  params: Promise<{ tenant: string; orderId: string }>;
};

export default async function OrderStatusPage({ params }: Props) {
  const { tenant, orderId } = await params;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-200 text-3xl dark:bg-green-900">
          ✓
        </div>
        <h1 className="text-2xl font-bold">Order Received</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          주문 번호 <span className="font-mono font-semibold">{orderId}</span> — 테넌트{" "}
          {tenant}
        </p>
      </div>

      <div className="rounded-xl border-2 border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-center font-medium text-orange-800 dark:text-orange-400">
          진행 단계 · 예상 대기 시간 UI (OrderProgressSteps)
        </p>
      </div>
    </div>
  );
}
