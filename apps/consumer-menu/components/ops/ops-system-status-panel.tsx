import { probeOpsSystemStatus } from "@/lib/platform/probe-ops-system-status";

function siteOrigin(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "") ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return fromEnv || "http://localhost:3000";
}

/** `/health` 연동 시스템 상태 */
export async function OpsSystemStatusPanel() {
  const probe = await probeOpsSystemStatus(siteOrigin());

  const rows = [
    {
      icon: "⚡",
      name: "API 서버",
      meta: probe.apiDetail,
      status: probe.apiOk ? "정상" : "점검",
      tone: probe.apiOk ? ("ok" as const) : ("warn" as const),
    },
    {
      icon: "🗄️",
      name: "Supabase DB",
      meta: probe.dbDetail,
      status: probe.dbOk ? "정상" : "점검",
      tone: probe.dbOk ? ("ok" as const) : ("warn" as const),
    },
    {
      icon: "🌐",
      name: "Vercel CDN",
      meta: probe.cdnDetail,
      status: probe.cdnOk ? "정상" : "점검",
      tone: probe.cdnOk ? ("ok" as const) : ("warn" as const),
    },
    {
      icon: "🔔",
      name: "푸시 · 알림",
      meta: probe.pushDetail,
      status: probe.pushOk ? "정상" : "주의",
      tone: probe.pushOk ? ("ok" as const) : ("warn" as const),
    },
  ];

  return (
    <div>
      {rows.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between border-t border-ops-border py-3 first:border-t-0"
        >
          <div className="flex items-center gap-3">
            <span className="text-lg" aria-hidden>
              {item.icon}
            </span>
            <div>
              <p className="text-[13px] font-bold text-ops-text">{item.name}</p>
              <p className="text-[11px] font-medium text-[#4A5568]">{item.meta}</p>
            </div>
          </div>
          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${item.tone === "ok" ? "text-[#22D3A0]" : "text-[#F7983A]"}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${item.tone === "ok" ? "animate-pulse bg-[#22D3A0]" : "bg-[#F7983A]"}`}
            />
            {item.status}
          </div>
        </div>
      ))}
      <p className="mt-3 text-[11px] font-medium text-[#4A5568]">
        상세:{" "}
        <a href="/health" className="text-[#5B6BF8] underline-offset-2 hover:underline">
          /health
        </a>
      </p>
    </div>
  );
}
