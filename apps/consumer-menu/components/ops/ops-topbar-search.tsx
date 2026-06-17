"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Props = {
  defaultQuery?: string;
};

/** 탑바 검색 → `/ops/search` */
export function OpsTopbarSearch({ defaultQuery = "" }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    router.push(`/ops/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex w-60 items-center gap-2 rounded-lg border border-ops-border bg-ops-surface-2 px-3 py-1.5 transition focus-within:border-[#5B6BF8]">
      <span className="text-[13px] text-ops-muted" aria-hidden>
        🔍
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="매장명, 메뉴 검색"
        className="w-full bg-transparent text-xs font-medium text-ops-text outline-none placeholder:text-ops-muted"
        aria-label="플랫폼 검색"
        minLength={2}
      />
    </form>
  );
}
