"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  clearCart,
  readCart,
  writeCart,
  type CartLine,
} from "@/lib/cart/local-cart";
import { PREF_TABLE_MAX, readTablePref } from "@/lib/cart/table-pref";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";
import { syncGuestSessionCookieFromBrowser } from "@/lib/guest-session/sync-guest-session-cookie";

import { submitGuestOrderAction } from "./actions";

/**
 * 주문 제출은 게스트 서버 액션으로 처리됩니다.
 * 카드·간편결제 등은 `lib/consumer/future-features` 의 `CONSUMER_CHECKOUT_PAYMENT_IMPLEMENTED` 가
 * `true`가 된 뒤 `POST /t/{tenant}/checkout/payment` 등 서버 경로에만 연동합니다.
 */
const LAST_ORDER_KEY = "chaya_last_order_id";

type Props = {
  tenant: string;
  initialLines: CartLine[];
  /** `/cart?table=` 또는 이전 페이지에서 저장된 QR 테이블 힌트 */
  initialTableHint?: string | null;
};

function ensureGuestSession(): string {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
    if (!s || s.length < 8) {
      s = crypto.randomUUID();
      localStorage.setItem(GUEST_SESSION_STORAGE_KEY, s);
    }
    syncGuestSessionCookieFromBrowser();
    return s;
  } catch {
    return "";
  }
}

export function CartCheckoutClient({ tenant, initialLines, initialTableHint }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tableNo, setTableNo] = useState(
    () => (initialTableHint?.trim() ?? "").slice(0, PREF_TABLE_MAX),
  );
  const [guestNote, setGuestNote] = useState("");
  const serverFallback = useRef(initialLines);
  serverFallback.current = initialLines;
  /** 연속 클릭·빠른 더블 탭으로 동일 주문이 두 번 나가지 않도록 */
  const submitLock = useRef(false);
  const tablePrefSeeded = useRef(false);

  useEffect(() => {
    const stored = readCart(tenant);
    setLines(stored.length > 0 ? stored : serverFallback.current);
    setMounted(true);
  }, [tenant]);

  useEffect(() => {
    const hint = (initialTableHint?.trim() ?? "").slice(0, PREF_TABLE_MAX);
    if (hint) setTableNo(hint);
  }, [initialTableHint]);

  useEffect(() => {
    if (!mounted || tablePrefSeeded.current) return;
    tablePrefSeeded.current = true;
    setTableNo((prev) => {
      if (prev.trim()) return prev;
      const fromStore = readTablePref(tenant);
      return fromStore || prev;
    });
  }, [mounted, tenant]);

  useEffect(() => {
    if (!mounted) return;
    writeCart(tenant, lines);
  }, [lines, tenant, mounted]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    [lines],
  );

  const setQty = (id: string, quantity: number) => {
    const q = Math.max(1, Math.min(99, Math.floor(quantity)));
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, quantity: q } : l)));
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  };

  const submit = () => {
    if (submitLock.current || lines.length === 0) return;
    submitLock.current = true;
    setError(null);
    ensureGuestSession();
    const guestSessionId =
      typeof window !== "undefined" ? localStorage.getItem(GUEST_SESSION_STORAGE_KEY) : null;

    startTransition(async () => {
      let orderSucceeded = false;
      try {
        const res = await submitGuestOrderAction(
          tenant,
          JSON.stringify(lines),
          guestSessionId,
          tableNo.trim() || null,
          guestNote.trim() || null,
        );
        if (!res.ok) {
          setError(res.message);
          return;
        }
        orderSucceeded = true;
        try {
          localStorage.setItem(LAST_ORDER_KEY, res.orderId);
        } catch {
          /* ignore quota / private mode */
        }
        clearCart(tenant);
        router.push(`/t/${tenant}/orders/${res.orderId}`);
      } finally {
        if (!orderSucceeded) submitLock.current = false;
      }
    });
  };

  if (!mounted) {
    return (
      <p
        role="status"
        aria-live="polite"
        className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950"
      >
        장바구니 불러오는 중…
      </p>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="rounded-xl border border-chaya-border bg-chaya-surface p-6 dark:border-zinc-700 dark:bg-zinc-950">
        <p className="text-zinc-600 dark:text-zinc-400">
          담긴 메뉴가 없습니다. 메뉴판에서 <span className="font-medium">담기</span> 또는 상세 화면에서 수량을
          정한 뒤 담아 주세요.
        </p>
        <a
          href={`/t/${tenant}`}
          className="mt-4 inline-block min-h-[44px] min-w-[44px] py-3 font-semibold text-chaya-primary underline-offset-4 hover:underline"
          aria-label="메뉴판으로 돌아가기"
        >
          메뉴로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul
        className="divide-y divide-chaya-border rounded-xl border border-chaya-border dark:divide-zinc-800 dark:border-zinc-700"
        aria-label="담긴 메뉴 목록"
      >
        {lines.map((line) => (
          <li key={line.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{line.name}</p>
              <p className="text-sm text-zinc-500">
                품목 합계 {(line.price * line.quantity).toLocaleString("ko-KR")}원{" "}
                <span className="text-zinc-400">
                  (단가 {line.price.toLocaleString("ko-KR")}원 × {line.quantity}개)
                </span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor={`qty-${line.id}`}>
                {line.name} 수량
              </label>
              <input
                id={`qty-${line.id}`}
                type="number"
                inputMode="numeric"
                min={1}
                max={99}
                className="min-h-[44px] w-24 rounded-lg border border-chaya-border bg-white px-2 py-2 text-center text-base dark:border-zinc-700 dark:bg-zinc-900"
                value={line.quantity}
                onChange={(e) => setQty(line.id, Number(e.target.value))}
              />
              <button
                type="button"
                className="min-h-[44px] rounded-lg px-3 text-sm font-semibold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                aria-label={`${line.name} 줄 장바구니에서 삭제`}
                onClick={() => removeLine(line.id)}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between rounded-xl border border-chaya-border bg-chaya-surface px-4 py-3 dark:border-zinc-700 dark:bg-zinc-950">
        <span className="font-medium text-zinc-600 dark:text-zinc-400">합계</span>
        <span className="text-lg font-bold">{total.toLocaleString("ko-KR")}원</span>
      </div>

      <div className="space-y-4 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <div>
          <label htmlFor="cart-table-no" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            테이블 번호 <span className="font-normal text-zinc-500">(선택)</span>
          </label>
          <input
            id="cart-table-no"
            type="text"
            inputMode="numeric"
            maxLength={PREF_TABLE_MAX}
            autoComplete="off"
            className="mt-1 min-h-[44px] w-full rounded-lg border border-chaya-border bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="예: 12"
            value={tableNo}
            onChange={(e) => setTableNo(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="cart-guest-note" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            요청사항 <span className="font-normal text-zinc-500">(선택)</span>
          </label>
          <textarea
            id="cart-guest-note"
            rows={3}
            maxLength={500}
            aria-describedby="cart-guest-note-count"
            className="mt-1 min-h-[88px] w-full resize-y rounded-lg border border-chaya-border bg-white px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="알레르기, 덜 맵게 등"
            value={guestNote}
            onChange={(e) => setGuestNote(e.target.value)}
          />
          <p id="cart-guest-note-count" className="mt-1 text-right text-xs text-zinc-400">
            {guestNote.length}/500자
          </p>
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert" aria-live="assertive">
          {error}
        </p>
      ) : null}

      <p id="checkout-guest-order-hint" className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        접수 후 주문 확인·목록은 <strong className="font-medium text-zinc-800 dark:text-zinc-200">이 폰·이 브라우저</strong>에서 하단 「주문 현황」으로 보는 것이 가장 안전합니다.
      </p>

      <button
        type="button"
        className="min-h-[48px] w-full rounded-2xl bg-chaya-primary py-4 text-lg font-bold text-chaya-on-primary shadow-sm transition hover:opacity-95 disabled:opacity-60"
        disabled={pending || lines.length === 0}
        aria-busy={pending}
        aria-describedby="checkout-guest-order-hint"
        aria-label={pending ? "주문 전송 중" : `총 ${total.toLocaleString("ko-KR")}원 주문 보내기`}
        onClick={submit}
      >
        {pending ? "주문 전송 중…" : "주문 보내기"}
      </button>

      <p className="text-center text-xs text-zinc-500">
        장바구니는 가게(`tenant`)마다 이 기기 브라우저에만 저장됩니다.
      </p>
    </div>
  );
}
