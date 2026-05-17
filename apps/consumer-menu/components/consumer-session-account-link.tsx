"use client";

import Link from "next/link";

type Props = {
  tenant: string;
  loggedIn: boolean;
};

export function ConsumerSessionAccountLink({ tenant, loggedIn }: Props) {
  if (loggedIn) {
    return (
      <form action={`/t/${encodeURIComponent(tenant)}/logout`} method="post" className="shrink-0">
        <input type="hidden" name="next" value={`/t/${tenant}`} />
        <button
          type="submit"
          className="min-h-[44px] rounded-xl border border-chaya-border px-3 py-2 text-sm font-semibold text-chaya-primary dark:border-zinc-700"
        >
          로그아웃
        </button>
      </form>
    );
  }

  return (
    <Link
      href={`/t/${encodeURIComponent(tenant)}/login?next=${encodeURIComponent(`/t/${tenant}/orders`)}`}
      className="min-h-[44px] shrink-0 rounded-xl border border-chaya-border px-3 py-2 text-sm font-semibold text-chaya-primary dark:border-zinc-700"
    >
      로그인
    </Link>
  );
}
