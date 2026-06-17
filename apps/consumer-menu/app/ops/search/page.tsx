import Link from "next/link";

import { OpsConsoleFrame } from "@/components/ops/ops-console-frame";
import { OpsBadge, OpsCard, OpsPageHero, healthScoreColor, healthScoreTone } from "@/components/ops/ops-ui";
import { searchPlatform } from "@/lib/platform/search-platform";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { opsGrid2ColClass } from "@/lib/responsive/chaya-ops-shell";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function OpsSearchPage({ searchParams }: Props) {
  await requirePlatformOperator("/ops/search");
  const { q = "" } = await searchParams;
  const result = await searchPlatform(q);

  return (
    <OpsConsoleFrame bare>
      <OpsPageHero
        title="검색"
        subtitle={q.trim() ? `"${q.trim()}" 결과` : "2자 이상 입력 후 탑바에서 검색하세요"}
      />

      {!result.ok ? (
        <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {result.message}
        </p>
      ) : q.trim().length < 2 ? (
        <OpsCard title="검색 안내" subtitle="매장명·슬러그·메뉴명">
          <p className="text-sm text-ops-muted">상단 검색창에 2자 이상 입력해주세요.</p>
        </OpsCard>
      ) : (
        <div className={opsGrid2ColClass}>
          <OpsCard title={`매장 (${result.stores.length})`} subtitle="이름·슬러그 일치">
            {result.stores.length === 0 ? (
              <p className="text-sm text-ops-muted">일치하는 매장이 없습니다.</p>
            ) : (
              <ul>
                {result.stores.map((s) => (
                  <li key={s.tenantSlug} className="border-t border-ops-border first:border-t-0">
                    <Link
                      href={`/ops/stores/${encodeURIComponent(s.tenantSlug)}`}
                      className="flex items-center justify-between gap-3 py-3 transition hover:opacity-90"
                    >
                      <div>
                        <p className="text-[13px] font-bold text-ops-text">{s.displayName}</p>
                        <p className="text-[11px] text-[#4A5568]">{s.tenantSlug}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {s.atRisk ? <OpsBadge tone="red">위험</OpsBadge> : null}
                        <span className={`text-sm font-black tabular-nums ${healthScoreColor(healthScoreTone(s.healthScore))}`}>
                          {s.healthScore}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>

          <OpsCard title={`메뉴 (${result.menus.length})`} subtitle="메뉴명 부분 일치">
            {result.menus.length === 0 ? (
              <p className="text-sm text-ops-muted">일치하는 메뉴가 없습니다.</p>
            ) : (
              <ul>
                {result.menus.map((m) => (
                  <li key={`${m.tenantSlug}-${m.menuId}`} className="border-t border-ops-border first:border-t-0">
                    <Link
                      href={`/ops/stores/${encodeURIComponent(m.tenantSlug)}`}
                      className="flex items-center justify-between gap-3 py-3 transition hover:opacity-90"
                    >
                      <div>
                        <p className="text-[13px] font-bold text-ops-text">{m.name}</p>
                        <p className="text-[11px] text-[#4A5568]">{m.tenantSlug}</p>
                      </div>
                      <span className="text-xs font-semibold text-[#5B6BF8]">매장 →</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </OpsCard>
        </div>
      )}
    </OpsConsoleFrame>
  );
}
