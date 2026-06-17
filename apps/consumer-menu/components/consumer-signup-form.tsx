"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { chayaFormCardClass, chayaInputClass, chayaPrimaryButtonClass } from "@/components/menu-list-styles";
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
      className={`mx-auto max-w-sm ${chayaFormCardClass}`}
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
          className={chayaInputClass}
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
          className={chayaInputClass}
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
        className={`w-full ${chayaPrimaryButtonClass}`}
      >
        회원가입
      </button>
    </form>
  );
}
