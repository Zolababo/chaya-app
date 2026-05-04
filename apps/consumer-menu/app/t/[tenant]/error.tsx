"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

function tenantBase(pathname: string): string {
  const m = pathname.match(/^\/t\/([^/]+)/);
  return m ? `/t/${decodeURIComponent(m[1])}` : "/";
}

export default function TenantSegmentError({ error, reset }: Props) {
  const pathname = usePathname();
  const base = tenantBase(pathname);

  useEffect(() => {
    console.error("[tenant route]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md space-y-4 text-center" role="alert" aria-live="assertive">
      <h1 className="text-xl font-bold">화면을 불러오지 못했습니다</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        잠시 후 다시 시도하거나 메뉴 처음으로 이동해 주세요.
      </p>
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
        <button
          type="button"
          onClick={() => reset()}
          className="min-h-[48px] rounded-xl bg-chaya-primary px-6 py-3 font-semibold text-chaya-on-primary"
        >
          다시 시도
        </button>
        <Link
          href={base}
          className="flex min-h-[48px] items-center justify-center rounded-xl border border-chaya-border px-6 py-3 font-semibold text-chaya-primary dark:border-zinc-700"
          aria-label="이 가게 메뉴판으로"
        >
          이 가게 메뉴로
        </Link>
      </div>
    </div>
  );
}
