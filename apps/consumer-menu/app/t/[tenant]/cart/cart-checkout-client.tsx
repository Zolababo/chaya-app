"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

import {
  clearCart,
  readCart,
  writeCart,
  type CartLine,
} from "@/lib/cart/local-cart";

import { submitGuestOrderAction } from "./actions";

const SESSION_KEY = "chaya_guest_session";
const LAST_ORDER_KEY = "chaya_last_order_id";

type Props = {
  tenant: string;
  initialLines: CartLine[];
};

function ensureGuestSession(): string {
  if (typeof window === "undefined") return "";
  try {
    let s = localStorage.getItem(SESSION_KEY);
    if (!s || s.length < 8) {
      s = crypto.randomUUID();
      localStorage.setItem(SESSION_KEY, s);
    }
    return s;
  } catch {
    return "";
  }
}

export function CartCheckoutClient({ tenant, initialLines }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [tableNo, setTableNo] = useState("");
  const [guestNote, setGuestNote] = useState("");
  const serverFallback = useRef(initialLines);
  serverFallback.current = initialLines;
  /** 연속 클릭·빠른 더블 탭으로 동일 주문이 두 번 나가지 않도록 */
  const submitLock = useRef(false);

  useEffect(() => {
    const stored = readCart(tenant);
    setLines(stored.length > 0 ? stored : serverFallback.current);
    setMounted(true);
  }, [tenant]);

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
      typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY) : null;

    startTransition(async () => {
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
        try {
          localStorage.setItem(LAST_ORDER_KEY, res.orderId);
        } catch {
          /* ignore quota / private mode */
        }
        clearCart(tenant);
        router.push(`/t/${tenant}/orders/${res.orderId}`);
      } finally {
        submitLock.current = false;
      }
    });
  };

  if (!mounted) {
    return (
      <p className="rounded-xl border border-chaya-border bg-chaya-surface px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-950">
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
          className="mt-4 inline-block font-semibold text-chaya-primary underline-offset-4 hover:underline"
        >
          메뉴로 돌아가기
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-chaya-border rounded-xl border border-chaya-border dark:divide-zinc-800 dark:border-zinc-700">
        {lines.map((line) => (
          <li key={line.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{line.name}</p>
              <p className="text-sm text-zinc-500">
                단가 {(line.price * line.quantity).toLocaleString("ko-KR")}원
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="sr-only" htmlFor={`qty-${line.id}`}>
                {line.name} 수량
              </label>
              <input
                id={`qty-${line.id}`}
                type="number"
                min={1}
                max={99}
                className="w-20 rounded-lg border border-chaya-border bg-white px-2 py-1 text-center dark:border-zinc-700 dark:bg-zinc-900"
                value={line.quantity}
                onChange={(e) => setQty(line.id, Number(e.target.value))}
              />
              <button
                type="button"
                className="text-sm font-semibold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
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
            maxLength={30}
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
            className="mt-1 w-full resize-y rounded-lg border border-chaya-border bg-white px-3 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            placeholder="알레르기, 덜 맵게 등"
            value={guestNote}
            onChange={(e) => setGuestNote(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-zinc-400">{guestNote.length}/500</p>
        </div>
      </div>

      {error ? (
        <p className="text-sm font-medium text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        className="w-full rounded-2xl bg-chaya-primary py-4 text-lg font-bold text-chaya-on-primary shadow-sm transition hover:opacity-95 disabled:opacity-60"
        disabled={pending || lines.length === 0}
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
