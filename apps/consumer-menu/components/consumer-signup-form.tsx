"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GUEST_SESSION_STORAGE_KEY } from "@/lib/guest-session/constants";

type Props = {
  tenant: string;
  nextPath: string;
  errorMessage: string | null;
};

export function ConsumerSignupForm({ tenant, nextPath, errorMessage }: Props) {
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
      action={`/t/${encodeURIComponent(tenant)}/signup/submit`}
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
        <label htmlFor="signup-email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          이메일
        </label>
        <input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 min-h-[44px] w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="signup-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          비밀번호
        </label>
        <input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="mt-1 min-h-[44px] w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500">8자 이상</p>
      </div>

      <p className="text-xs text-zinc-500">
        가입 후 이 폰·브라우저의 비회원 주문을 계정에 연결합니다. 이미 계정이 있으면{" "}
        <Link
          href={`/t/${encodeURIComponent(tenant)}/login?next=${encodeURIComponent(nextPath)}`}
          className="font-semibold text-chaya-primary underline-offset-2 hover:underline"
        >
          로그인
        </Link>
        하세요.
      </p>

      <button
        type="submit"
        className="min-h-[48px] w-full rounded-2xl bg-chaya-primary py-3 font-bold text-chaya-on-primary"
      >
        회원가입
      </button>
    </form>
  );
}
