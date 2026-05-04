import Link from "next/link";

import { GuestOrderStatusLive } from "@/components/guest-order-status-live";
import { fetchGuestOrder } from "@/lib/orders/fetch-guest-order";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string; orderId: string }>;
};

export default async function OrderStatusPage({ params }: Props) {
  const { tenant, orderId } = await params;
  const order = await fetchGuestOrder(tenant, orderId);

  if (order == null) {
    return (
      <div className="mx-auto max-w-lg space-y-4 text-center" role="alert" aria-live="assertive">
        <h1 id="order-not-found-heading" className="text-2xl font-bold">
          주문을 찾을 수 없습니다
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          주문 번호가 올바른지, 가게 경로(`/t/…`)가 주문할 때와 같은지 확인해 주세요. 다른 폰이나 시크릿 창·데이터 삭제 후에는 같은 주문이 안 보일 수 있습니다.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Supabase RPC{" "}
          <code className="rounded bg-zinc-200 px-1 font-mono text-xs dark:bg-zinc-800">get_order_for_guest</code>{" "}
          마이그레이션 적용 여부도 확인해 주세요.
        </p>
        <Link
          href={`/t/${tenant}/cart`}
          className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-6 py-3 font-semibold text-chaya-on-primary"
          aria-label="장바구니로 이동"
        >
          장바구니로
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-8" aria-labelledby="order-received-heading">
      <div className="text-center">
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-200 text-3xl dark:bg-green-900"
          aria-hidden
        >
          ✓
        </div>
        <p className="sr-only">주문 접수 완료</p>
        <h1 id="order-received-heading" className="text-2xl font-bold">
          주문이 접수되었습니다
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          주문 번호 <span className="font-mono font-semibold">{order.id.slice(0, 8)}</span>…
        </p>
        {order.created_at ? (
          <p className="mt-1 text-sm text-zinc-500">
            {new Date(order.created_at).toLocaleString("ko-KR")}
          </p>
        ) : null}
        <GuestOrderStatusLive tenant={tenant} orderId={order.id} initialStatus={order.status} />
      </div>

      {(order.table_no || order.guest_note) && (
        <div
          className="rounded-xl border border-chaya-border bg-chaya-surface p-4 text-left dark:border-zinc-700 dark:bg-zinc-950"
          aria-label="테이블 번호와 요청 사항"
        >
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
        <h2 id="order-lines-heading" className="mb-3 font-semibold text-zinc-800 dark:text-zinc-200">
          주문 내역
        </h2>
        <ul
          className="divide-y divide-chaya-border dark:divide-zinc-800"
          aria-labelledby="order-lines-heading"
        >
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

      <nav className="flex flex-wrap justify-center gap-3" aria-label="다음 이동">
        <Link
          href={`/t/${tenant}/orders`}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-6 py-3 font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label="비회원 주문 목록으로"
        >
          주문 목록
        </Link>
        <Link
          href={`/t/${tenant}`}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-6 py-3 font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label="메뉴판으로 돌아가기"
        >
          메뉴로 돌아가기
        </Link>
      </nav>
    </div>
  );
}
