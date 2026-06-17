import Link from "next/link";

import {
  chayaOpsContentClass,
  chayaOpsShellClass,
  opsShellWithCompactNavClass,
} from "@/lib/responsive/chaya-ops-shell";

export default function PlatformForbiddenPage() {
  return (
    <div
      className={`p-8 text-center ${chayaOpsShellClass} ${chayaOpsContentClass} ${opsShellWithCompactNavClass}`}
      role="alert"
      aria-live="assertive"
    >
      <h1 className="text-xl font-bold">플랫폼 관리 접근 불가</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        로그인한 계정은 <span className="font-mono">platform_operators</span> 에 등록되어 있지 않습니다. Supabase에서 운영자 행을
        추가한 뒤 다시 시도해 주세요.
      </p>
      <p className="mt-6 flex flex-col items-center gap-4">
        <Link
          href="/ops/login"
          className="inline-flex min-h-[48px] items-center justify-center font-semibold text-chaya-primary underline-offset-4 hover:underline dark:text-orange-400"
        >
          로그인
        </Link>
        <Link
          href="/start"
          className="text-sm font-medium text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
        >
          역할 선택
        </Link>
      </p>
    </div>
  );
}
