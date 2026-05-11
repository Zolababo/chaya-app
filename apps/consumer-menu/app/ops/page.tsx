import Link from "next/link";

import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const dynamic = "force-dynamic";

export default async function OpsHomePage() {
  await requirePlatformOperator("/ops");

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-10 border-b border-chaya-border pb-6 dark:border-zinc-700">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Platform</p>
        <h1 className="mt-2 text-3xl font-bold">운영 대시보드</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">점주 앱 접근 계정 및 가게별 권한을 관리합니다.</p>
      </header>

      <nav aria-label="운영 메뉴" className="space-y-3">
        <Link
          href="/ops/merchants"
          className="flex min-h-[56px] items-center rounded-xl border border-chaya-border bg-white px-4 text-base font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          점주 멤버십 관리 →
        </Link>
      </nav>

      <p className="mt-16 text-center text-sm text-zinc-500">
        <Link href="/m/login" className="underline-offset-4 hover:underline">
          점주 화면
        </Link>
        {" · "}
        <form action="/ops/logout" method="post" className="inline">
          <button type="submit" className="underline-offset-4 hover:underline">
            로그아웃
          </button>
        </form>
      </p>
    </div>
  );
}
