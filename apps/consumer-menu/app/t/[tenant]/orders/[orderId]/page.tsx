import { OrderStatusRefresh } from "@/components/order-status-refresh";
import { fetchGuestOrder } from "@/lib/orders/fetch-guest-order";
import { orderStatusLabel } from "@/lib/orders/order-status-label";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string; orderId: string }>;
};

export default async function OrderStatusPage({ params }: Props) {
  const { tenant, orderId } = await params;
  const order = await fetchGuestOrder(tenant, orderId);

  if (order == null) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center">
        <h1 className="text-2xl font-bold">주문을 찾을 수 없습니다</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          주문 번호가 올바른지, 가게 경로(`/t/…`)가 주문할 때와 같은지 확인해 주세요. Supabase RPC
          <code className="mx-1 rounded bg-zinc-200 px-1 font-mono text-sm dark:bg-zinc-800">
            get_order_for_guest
          </code>
          마이그레이션을 적용했는지도 확인해 주세요.
        </p>
        <a
          href={`/t/${tenant}/cart`}
          className="inline-block rounded-xl bg-chaya-primary px-6 py-3 font-semibold text-chaya-on-primary"
        >
          장바구니로
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-200 text-3xl dark:bg-green-900">
          ✓
        </div>
        <h1 className="text-2xl font-bold">주문이 접수되었습니다</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          주문 번호 <span className="font-mono font-semibold">{order.id.slice(0, 8)}</span>…
        </p>
        {order.created_at ? (
          <p className="mt-1 text-sm text-zinc-500">
            {new Date(order.created_at).toLocaleString("ko-KR")}
          </p>
        ) : null}
        <p className="mt-3 inline-flex rounded-full bg-zinc-200 px-4 py-1 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {orderStatusLabel(order.status)}
        </p>
      </div>

      {(order.table_no || order.guest_note) && (
        <div className="rounded-xl border border-chaya-border bg-chaya-surface p-4 text-left dark:border-zinc-700 dark:bg-zinc-950">
          {order.table_no ? (
            <p className="text-sm">
              <span className="font-medium text-zinc-600 dark:text-zinc-400">테이블</span>{" "}
              <span className="font-semibold">{order.table_no}</span>
            </p>
          ) : null}
          {order.guest_note ? (
            <p className={`text-sm ${order.table_no ? "mt-2" : ""}`}>
              <span className="font-medium text-zinc-600 dark:text-zinc-400">요청</span>{" "}
              <span className="whitespace-pre-wrap">{order.guest_note}</span>
            </p>
          ) : null}
        </div>
      )}

      <div className="rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <h2 className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">주문 내역</h2>
        <ul className="divide-y divide-chaya-border dark:divide-zinc-800">
          {order.lines.map((line, i) => (
            <li key={`${line.name}-${i}`} className="flex justify-between py-2 text-sm">
              <span>
                {line.name}{" "}
                <span className="text-zinc-500">
                  × {line.quantity}
                </span>
              </span>
              <span className="tabular-nums">{(line.price * line.quantity).toLocaleString("ko-KR")}원</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-chaya-border pt-3 font-semibold dark:border-zinc-800">
          <span>합계</span>
          <span className="tabular-nums">{order.total_price.toLocaleString("ko-KR")}원</span>
        </div>
      </div>

      <OrderStatusRefresh />

      <p className="text-center text-sm text-zinc-500">상태는 매장에서 DB를 갱신하면 위 간격으로 반영됩니다.</p>

      <div className="flex justify-center">
        <a
          href={`/t/${tenant}`}
          className="rounded-xl border border-chaya-border px-6 py-3 font-semibold text-chaya-primary dark:border-zinc-700"
        >
          메뉴로 돌아가기
        </a>
      </div>
    </div>
  );
}
