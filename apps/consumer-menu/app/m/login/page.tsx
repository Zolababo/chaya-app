import Link from "next/link";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ next?: string; e?: string; phase?: string }>;
};

function alertMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "missing":
      return "휴대폰 번호 또는 인증번호를 입력해 주세요.";
    case "bad_phone":
      return "휴대폰 번호 형식을 확인해 주세요. (예: 01012345678)";
    case "send_failed":
      return "문자 발송에 실패했습니다. Supabase 에서 Phone 인증과 SMS(Twilio 등) 설정, 등록된 번호인지 확인해 주세요.";
    case "verify_failed":
      return "인증번호가 올바르지 않거나 만료되었습니다.";
    case "otp_session":
      return "먼저 ‘인증번호 받기’로 진행했는지 확인하거나, 페이지를 새로 시작해 주세요.";
    case "no_anon":
      return "NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인해 주세요.";
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
  const isConfirm =
    typeof sp.phase === "string" && sp.phase.toLowerCase() === "confirm";

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="mt-2 text-2xl font-bold">{isConfirm ? "문자 인증" : "점주 로그인"}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {isConfirm
            ? "문자로 받은 숫자를 입력한 뒤 로그인하세요."
            : "등록된 휴대폰 번호로 문자 인증을 받습니다. 계정 등록은 운영(`/ops`)에서 초대해야 합니다."}
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

      {isConfirm ? (
        <form action="/m/login/verify-otp" method="post" className="space-y-4">
          <input type="hidden" name="next" value={safeNext} />
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="m-token">
              인증번호
            </label>
            <input
              id="m-token"
              name="token"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 text-lg tracking-widest dark:border-zinc-700 dark:bg-zinc-900"
              aria-describedby="m-token-help"
              maxLength={12}
              placeholder="6자리"
            />
            <p id="m-token-help" className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              같은 번호에서 다시 받으려면 아래에서 ‘번호 변경’ 후 인증번호를 다시 받을 수 있습니다.
            </p>
          </div>
          <button
            type="submit"
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            로그인
          </button>
        </form>
      ) : (
        <form action="/m/login/send-otp" method="post" className="space-y-4">
          <input type="hidden" name="next" value={safeNext} />
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="m-phone">
              휴대폰 번호
            </label>
            <input
              id="m-phone"
              name="phone"
              type="tel"
              autoComplete="tel-national"
              required
              placeholder="예: 01012345678"
              className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          <button
            type="submit"
            className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            인증번호 받기
          </button>
        </form>
      )}

      <p className="mt-6 text-center">
        <Link href={`/m/login?next=${encodeURIComponent(safeNext)}`} className="text-sm text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400">
          번호 변경·처음부터
        </Link>
      </p>

      <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/" className="font-medium text-chaya-primary underline-offset-4 hover:underline">
          손님 메뉴판으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
