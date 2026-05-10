import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string; e?: string }>;
};

function alertMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "missing":
      return "이메일과 비밀번호를 입력해 주세요.";
    case "auth":
      return "로그인에 실패했습니다. 이메일·비밀번호를 확인해 주세요.";
    case "unconfirmed":
      return "이메일 인증이 아직 완료되지 않았습니다. Supabase에서 인증 메일을 확인하거나, 개발용으로 이메일 확인을 끈 뒤 다시 시도해 주세요.";
    case "no_anon":
      return "Supabase 설정이 비어 있습니다. NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인해 주세요.";
    default:
      return null;
  }
}

export default async function MerchantLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const safeNext =
    typeof sp.next === "string" && sp.next.startsWith("/m") && !sp.next.startsWith("//")
      ? sp.next
      : "/m";
  const err = alertMessage(typeof sp.e === "string" ? sp.e : undefined);

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="mt-2 text-2xl font-bold">점주 로그인</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          가게별 아이디(이메일)로 로그인합니다. 접근이 필요하면 운영 측에 계정 초대를 요청해 주세요.
        </p>
      </header>

      {err ? (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
          aria-live="assertive"
        >
          {err}
        </p>
      ) : null}

      <form action="/m/login/submit" method="post" className="space-y-4">
        <input type="hidden" name="next" value={safeNext} />
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="m-email">
            이메일
          </label>
          <input
            id="m-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="m-password">
            비밀번호
          </label>
          <input
            id="m-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          로그인
        </button>
      </form>

      <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="font-medium text-chaya-primary underline-offset-4 hover:underline">
          손님 메뉴판으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
