import Link from "next/link";
import type { ReactNode } from "react";

import { getTenantBranding } from "@/lib/tenant/tenant-branding";
import { merchantSubpageHeaderClass } from "@/lib/responsive/chaya-app-shell";

type Props = {
  tenant: string;
  title: string;
  /** `매장명 — …` 앞에 붙지 않는 단독 설명이면 `standaloneDescription` 사용 */
  description: string;
  standaloneDescription?: boolean;
  trailing?: ReactNode;
  backHref?: string;
  backLabel?: string;
};

/** 점주 테넌트 페이지 공통 헤더 — 대시보드 복귀 + 매장명. 더보기 서브는 `MerchantMoreSubPageBack` 사용. */
export function MerchantPageHeader({
  tenant,
  title,
  description,
  standaloneDescription = false,
  trailing,
  backHref,
  backLabel = "← 홈",
}: Props) {
  const branding = getTenantBranding(tenant);
  const tEnc = encodeURIComponent(tenant);
  const homeHref = backHref ?? `/m/${tEnc}/dashboard`;

  return (
    <header
      className={`mb-6 border-b border-chaya-border pb-5 dark:border-zinc-700 ${merchantSubpageHeaderClass}`}
    >
      <Link
        href={homeHref}
        className="text-sm font-semibold text-chaya-primary underline-offset-2 hover:underline"
      >
        {backLabel}
      </Link>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{title}</h1>
        {trailing}
      </div>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        {standaloneDescription ? description : `${branding.displayName} — ${description}`}
      </p>
    </header>
  );
}
