"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";

import { GuestOrderRowCopyLinkButton } from "@/components/guest-order-row-copy-link-button";
import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import type { GuestOrderListItem } from "@/lib/orders/list-guest-orders";
import { orderStatusLabel } from "@/lib/orders/order-status-label";

import { ORDER_STATUS_POLL_MS } from "@/lib/orders/status-poll";

import { listGuestOrdersAction } from "./actions";

type Props = {
  tenant: string;
};

export function GuestOrdersHub({ tenant }: Props) {
  const [orders, setOrders] = useState<GuestOrderListItem[] | null>(null);
  const [noSession, setNoSession] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [reducedMotion, setReducedMotion] = useState(false);

  const load = useCallback(() => {
    if (typeof window === "undefined") return;
    let sid: string | null = null;
    try {
      sid = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    } catch {
      setNoSession(true);
      setOrders([]);
      setLoadError(null);
      return;
    }
    if (!sid || sid.length < 8) {
      setNoSession(true);
      setOrders([]);
      setLoadError(null);
      return;
    }
    setNoSession(false);
    startTransition(async () => {
      const res = await listGuestOrdersAction(tenant, sid!);
      if (res.ok) {
        setLoadError(null);
        setOrders(res.orders);
        return;
      }
      setOrders([]);
      if (res.errorKind === "no_client") {
        setLoadError("Supabase 환경 변수가 없어 목록을 불러올 수 없습니다.");
      } else {
        setLoadError(
          "목록을 불러오지 못했습니다. `list_orders_for_guest` RPC 적용 여부를 확인하거나 잠시 후 다시 시도해 주세요.",
        );
      }
    });
  }, [tenant]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reducedMotion || noSession) return;
    const id = window.setInterval(() => load(), ORDER_STATUS_POLL_MS);
    return () => window.clearInterval(id);
  }, [load, reducedMotion, noSession]);

  if (orders === null) {
    return (
      <p
        role="status"
        aria-live="polite"
        aria-busy={pending}
        className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
      >
        {pending ? "주문 내역 불러오는 중…" : "준비 중…"}
      </p>
    );
  }

  return (
    <section className="space-y-6" aria-label="주문 목록과 안내">
      {loadError ? (
        <div
          role="alert"
          aria-live="assertive"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-100"
        >
          <p>{loadError}</p>
          <button
            type="button"
            onClick={() => load()}
            className="mt-2 min-h-[44px] font-semibold underline-offset-2 hover:underline"
          >
            목록 다시 불러오기
          </button>
        </div>
      ) : null}

      {!loadError && !noSession && orders !== null && orders.length > 0 && !reducedMotion ? (
        <p className="text-center text-xs text-zinc-500" role="status" aria-live="polite">
          약 {Math.round(ORDER_STATUS_POLL_MS / 1000)}초마다 목록 상태를 다시 불러옵니다. 접근성 설정에서 동작 줄이기를 켜 두면
          자동 갱신은 꺼집니다.
        </p>
      ) : null}

      {noSession ? (
        <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-4 text-left text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          주문 목록·주문 링크는 <strong className="font-medium text-zinc-800 dark:text-zinc-200">주문할 때 쓴 같은 폰·같은 브라우저</strong>에서 열어야 이어집니다. 이 브라우저에는 비회원 주문 세션이 없습니다. 장바구니에서 주문을 내면
          여기에 같은 기기의 주문이 쌓입니다. 다른 폰이나 시크릿 창에서는 목록이 비어 있을 수 있습니다.
        </p>
      ) : null}

      {!loadError && !noSession && orders.length === 0 ? (
        <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-4 text-center text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          아직 이 가게에서 주문한 기록이 없습니다. 문자나 링크로 받은 주문 확인은{" "}
          <strong className="font-medium text-zinc-800 dark:text-zinc-200">이 폰·이 브라우저</strong>에서 열어 주세요. (Supabase RPC{" "}
          <code className="rounded bg-zinc-200 px-1 font-mono text-xs dark:bg-zinc-800">list_orders_for_guest</code>{" "}
          마이그레이션을 적용했는지도 확인해 주세요.)
        </p>
      ) : null}

      {orders.length > 0 ? (
        <ul
          className="divide-y divide-chaya-border rounded-xl border border-chaya-border dark:divide-zinc-800 dark:border-zinc-700"
          aria-label="이 가게 비회원 주문 목록"
        >
          {orders.map((o) => (
            <li key={o.id}>
              <div className="divide-y divide-chaya-border dark:divide-zinc-800">
                <Link
                  href={`/t/${tenant}/orders/${o.id}`}
                  aria-label={`주문 번호 앞 여덟 자리 ${o.id.slice(0, 8)}, ${orderStatusLabel(o.status)}, ${o.total_price.toLocaleString(
                    "ko-KR",
                  )}원, 상세 페이지로 이동`}
                  className="flex min-h-[44px] flex-col gap-1 px-4 py-4 transition hover:bg-zinc-50 dark:hover:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                      {o.id.slice(0, 8)}…
                    </p>
                    {o.created_at ? (
                      <p className="text-xs text-zinc-500">
                        {new Date(o.created_at).toLocaleString("ko-KR")}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <span className="inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {orderStatusLabel(o.status)}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-chaya-primary dark:text-orange-400">
                      {o.total_price.toLocaleString("ko-KR")}원
                    </span>
                  </div>
                </Link>
                <div className="bg-zinc-50/80 px-4 py-2 dark:bg-zinc-900/30">
                  <GuestOrderRowCopyLinkButton tenant={tenant} orderId={o.id} orderLabelShort={o.id.slice(0, 8)} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <nav className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-center" aria-label="다른 메뉴로 이동">
        <Link
          href={`/t/${tenant}`}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-4 py-3 text-center font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label="메뉴판으로"
        >
          메뉴로
        </Link>
        <Link
          href={`/t/${tenant}/cart`}
          className="flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-4 py-3 text-center font-semibold text-chaya-on-primary"
          aria-label="장바구니로"
        >
          장바구니
        </Link>
        <Link
          href={`/t/${tenant}/barrier-free`}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-4 py-3 text-center font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label="목록형 메뉴로. 같은 장바구니와 연결됩니다."
        >
          목록형 메뉴
        </Link>
      </nav>
    </section>
  );
}
