import Link from "next/link";
import { redirect } from "next/navigation";

import {
  MERCHANT_PASSWORD_MIN_LENGTH,
  resetPasswordErrorMessage,
} from "@/lib/merchant/merchant-password-auth";
import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";
import { chayaAuthShellClass } from "@/lib/responsive/chaya-app-shell";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ e?: string; ok?: string }>;
};

export default async function MerchantResetPasswordPage({ searchParams }: Props) {
  if (merchantLoginUsesSms()) {
    redirect("/m/login?e=sms_no_password");
  }

  const sp = await searchParams;
  const err = resetPasswordErrorMessage(typeof sp.e === "string" ? sp.e : undefined);
  const done = sp.ok === "1";

  const supabase = await createSupabaseServerClient();
  const hasSession = supabase ? !!(await resolveServerUser(supabase)) : false;

  if (done) {
    return (
      <div className={`min-h-dvh py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] ${chayaAuthShellClass}`}>
        <h1 className="text-2xl font-bold">비밀번호 변경 완료</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">새 비밀번호로 로그인해 주세요.</p>
        <Link
          href="/m/login"
          className="mt-8 flex min-h-[48px] items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          로그인
        </Link>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className={`min-h-dvh py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] ${chayaAuthShellClass}`}>
        <h1 className="text-2xl font-bold">새 비밀번호 설정</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          메일의 링크로 들어온 뒤에만 이 화면에서 비밀번호를 바꿀 수 있습니다.
        </p>
        {err ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
            {err}
          </p>
        ) : null}
        <Link
          href="/m/forgot-password"
          className="mt-8 inline-block text-sm font-medium text-chaya-primary underline-offset-4 hover:underline"
        >
          비밀번호 찾기 다시 요청
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-dvh py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] ${chayaAuthShellClass}`}>
      <header className="mb-8">
        <h1 className="text-2xl font-bold">새 비밀번호 설정</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {MERCHANT_PASSWORD_MIN_LENGTH}자 이상으로 입력해 주세요.
        </p>
      </header>

      {err ? (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {err}
        </p>
      ) : null}

      <form action="/m/reset-password/submit" method="post" className="space-y-4">
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="m-new-password">
            새 비밀번호
          </label>
          <input
            id="m-new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={MERCHANT_PASSWORD_MIN_LENGTH}
            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="m-new-password2">
            새 비밀번호 확인
          </label>
          <input
            id="m-new-password2"
            name="password_confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={MERCHANT_PASSWORD_MIN_LENGTH}
            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          저장
        </button>
      </form>
    </div>
  );
}
