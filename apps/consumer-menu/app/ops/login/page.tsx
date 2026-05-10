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
      return "로그인에 실패했습니다.";
    case "unconfirmed":
      return "이메일 인증이 완료되지 않았습니다.";
    case "no_anon":
      return "NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY 설정을 확인해 주세요.";
    default:
      return null;
  }
}

export default async function OpsLoginPage({ searchParams }: Props) {
  const sp = await searchParams;
  const safeNext =
    typeof sp.next === "string" && sp.next.startsWith("/ops") && !sp.next.startsWith("//") ? sp.next : "/ops";
  const err = alertMessage(typeof sp.e === "string" ? sp.e : undefined);

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-10">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Platform</p>
        <h1 className="mt-2 text-2xl font-bold">플랫폼 로그인</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          점주 계정 및 멤버십 관리 메뉴에 들어갑니다.
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

      <form action="/ops/login/submit" method="post" className="space-y-4">
        <input type="hidden" name="next" value={safeNext} />
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="p-email">
            이메일
          </label>
          <input
            id="p-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="p-password">
            비밀번호
          </label>
          <input
            id="p-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <button
          type="submit"
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-indigo-900 px-4 text-sm font-semibold text-white dark:bg-indigo-200 dark:text-indigo-950"
        >
          로그인
        </button>
      </form>

      <p className="mt-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
        접근 불가 시 · <span className="font-mono">platform_operators</span>
      </p>
      <p className="mt-4 text-center text-sm">
        <Link href="/m/login" className="font-medium text-chaya-primary underline-offset-4 hover:underline">
          점주 로그인
        </Link>
        {" · "}
        <Link href="/" className="font-medium text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400">
          소비자 앱
        </Link>
      </p>
    </div>
  );
}
