"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";

type Props = {
  tenant: string;
  nextPath: string;
  errorMessage: string | null;
};

export function ConsumerLoginForm({ tenant, nextPath, errorMessage }: Props) {
  const [guestSession, setGuestSession] = useState("");

  useEffect(() => {
    try {
      const sid = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);
      if (sid && sid.length >= 8) setGuestSession(sid);
    } catch {
      /* private mode */
    }
  }, []);

  return (
    <form
      action={`/t/${encodeURIComponent(tenant)}/login/submit`}
      method="post"
      className="mx-auto max-w-sm space-y-4 rounded-xl border border-chaya-border bg-chaya-surface p-6 dark:border-zinc-700 dark:bg-zinc-950"
    >
      <input type="hidden" name="next" value={nextPath} />
      <input type="hidden" name="guest_session_id" value={guestSession} readOnly />

      {errorMessage ? (
        <p role="alert" className="text-sm font-medium text-red-600 dark:text-red-400">
          {errorMessage}
        </p>
      ) : null}

      <div>
        <label htmlFor="consumer-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          이메일
        </label>
        <input
          id="consumer-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 min-h-[44px] w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="consumer-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          비밀번호
        </label>
        <input
          id="consumer-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1 min-h-[44px] w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <p className="text-xs text-zinc-500">
        로그인하면 이 폰·브라우저에서 보낸 비회원 주문을 내 계정에 연결(claim)할 수 있습니다. 계정이 없으면{" "}
        <Link
          href={`/t/${encodeURIComponent(tenant)}/signup?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-chaya-primary underline-offset-2 hover:underline"
        >
          회원가입
        </Link>
        하세요.
      </p>

      <button
        type="submit"
        className="min-h-[48px] w-full rounded-2xl bg-chaya-primary py-3 font-bold text-chaya-on-primary"
      >
        로그인
      </button>
    </form>
  );
}
