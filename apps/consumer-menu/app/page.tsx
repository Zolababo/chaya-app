import Link from "next/link";

/**
 * 루트 `/` 는 리다이렉트하지 않습니다.
 * manifest에 `start_url`을 두지 않으면, 홈 화면 추가 시점의 URL이 시작 주소로 쓰이는 클라이언트가 많습니다.
 * (고정 `start_url: "/"`이면 /m/login 에서 추가해도 아이콘이 / 로만 열려 손님 메뉴로 잘못 이어질 수 있음.)
 * 예전처럼 `/` → `/t/demo` 단방향 리다이렉트면, 점주가 `/m/*` 에서 추가해도 항상 손님 데모로 열리는 문제가 생깁니다.
 */
export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-4 py-12 pb-[max(2rem,env(safe-area-inset-bottom))]">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">CHAYA</p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50">시작</h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          홈 화면 바로가기는 보통 이 주소(<span className="font-mono text-xs">/</span>)로 열립니다.{" "}
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
