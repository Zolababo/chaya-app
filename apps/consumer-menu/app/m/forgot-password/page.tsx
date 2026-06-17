import Link from "next/link";
import { redirect } from "next/navigation";

import { forgotPasswordErrorMessage } from "@/lib/merchant/merchant-password-auth";
import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";
import { chayaAuthShellClass } from "@/lib/responsive/chaya-app-shell";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ e?: string; ok?: string }>;
};

export default async function MerchantForgotPasswordPage({ searchParams }: Props) {
  if (merchantLoginUsesSms()) {
    redirect("/m/login?e=sms_no_password");
  }

  const sp = await searchParams;
  const err = forgotPasswordErrorMessage(typeof sp.e === "string" ? sp.e : undefined);
  const sent = sp.ok === "sent";

  return (
    <div className={`min-h-dvh py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))] ${chayaAuthShellClass}`}>
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">CHAYA 점주</p>
        <h1 className="mt-2 text-2xl font-bold">비밀번호 찾기</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          가입·초대에 사용한 이메일로 재설정 링크를 보냅니다. 메일이 없으면 스팸함을 확인해 주세요.
        </p>
      </header>

      {sent ? (
        <p
          className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-950 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100"
          role="status"
        >
          요청을 접수했습니다. 등록된 이메일이 있으면 몇 분 안에 재설정 링크가 도착합니다.
        </p>
      ) : null}

      {err ? (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {err}
        </p>
      ) : null}

      {!sent ? (
        <form action="/m/forgot-password/submit" method="post" className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="m-forgot-email">
              이메일
            </label>
            <input
              id="m-forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            재설정 링크 보내기
          </button>
        </form>
      ) : null}

      <p className="mt-8 text-center text-sm">
        <Link href="/m/login" className="font-medium text-chaya-primary underline-offset-4 hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
