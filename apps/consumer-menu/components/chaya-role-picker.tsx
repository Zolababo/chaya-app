import Link from "next/link";

/** 손님·점주 역할 선택 — `/start` 또는 `CHAYA_ROOT_ROLE_PICKER=1` 일 때 `/` */
export function ChayaRolePicker() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">CHAYA</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">시작</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          <strong>손님</strong>과 <strong>점주</strong> 중에서 골라 들어가 주세요.
        </p>
      </header>

      <nav className="flex flex-col gap-3" aria-label="역할 선택">
        <Link
          href="/t/demo"
          className="flex min-h-[52px] items-center justify-center rounded-2xl border border-chaya-border bg-chaya-surface px-4 py-4 text-base font-semibold text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
        >
          손님 메뉴 (데모)
        </Link>
        <Link
          href="/m/login"
          className="flex min-h-[52px] items-center justify-center rounded-2xl bg-zinc-900 px-4 py-4 text-base font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          점주 로그인
        </Link>
      </nav>

      <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
        운영자는{" "}
        <Link href="/ops/login" className="font-medium text-chaya-primary underline-offset-2 hover:underline">
          /ops/login
        </Link>
      </p>
    </div>
  );
}
