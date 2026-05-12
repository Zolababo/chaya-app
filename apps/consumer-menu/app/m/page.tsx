import Link from "next/link";
import { redirect } from "next/navigation";

import { merchantAccessPendingUrl } from "@/lib/merchant/merchant-access";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export const dynamic = "force-dynamic";

type MemberRow = {
  tenant_slug: string;
  role: string;
  approved_at: string | null;
};

export default async function MerchantPortalHomePage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <h1 className="text-xl font-bold">설정 필요</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Supabase 클라이언트를 만들 수 없습니다. <span className="font-mono">NEXT_PUBLIC_SUPABASE_URL</span>·
          <span className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> 를 확인해 주세요.
        </p>
      </div>
    );
  }

  const user = await resolveServerUser(supabase);
  if (!user) {
    redirect("/m/login");
  }

  const { data: rows, error } = await supabase
    .from("merchant_tenant_members")
    .select("tenant_slug, role, approved_at")
    .order("tenant_slug", { ascending: true });

  if (error || !rows?.length) {
    redirect("/m/forbidden");
  }

  const list = rows as MemberRow[];
  const approvedRows = list.filter((r) => r.approved_at != null);
  const pendingRows = list.filter((r) => r.approved_at == null);

  if (approvedRows.length === 1 && pendingRows.length === 0) {
    redirect(`/m/${encodeURIComponent(approvedRows[0].tenant_slug)}/dashboard`);
  }

  if (approvedRows.length === 0 && pendingRows.length === 1) {
    redirect(merchantAccessPendingUrl(pendingRows[0].tenant_slug));
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="mt-2 text-2xl font-bold">가게 선택</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {approvedRows.length > 0
            ? "이용 중인 가게를 선택하세요. 승인 대기 중인 가게는 아래에 따로 표시됩니다."
            : "연결된 가게는 있으나 모두 운영 승인 대기입니다. 담당자에게 승인을 요청한 뒤 새로고침 해 주세요."}
        </p>
      </header>

      {approvedRows.length > 0 ? (
        <section className="mb-8">
          <h2 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">이용 가능</h2>
          <ul className="space-y-3">
            {approvedRows.map((r) => {
              const t = encodeURIComponent(r.tenant_slug);
              return (
                <li key={`ok-${r.tenant_slug}`}>
                  <Link
                    href={`/m/${t}/dashboard`}
                    className="flex min-h-[52px] items-center rounded-xl border border-chaya-border bg-white px-4 py-3 text-sm font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  >
                    <span>{r.tenant_slug}</span>
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {r.role === "staff" ? "직원" : "소장"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {pendingRows.length > 0 ? (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">승인 대기</h2>
          <ul className="space-y-3">
            {pendingRows.map((r) => {
              return (
                <li key={`pend-${r.tenant_slug}`}>
                  <Link
                    href={merchantAccessPendingUrl(r.tenant_slug)}
                    className="flex min-h-[52px] flex-col rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm font-semibold text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
                  >
                    <span>{r.tenant_slug}</span>
                    <span className="mt-1 text-xs font-normal opacity-90">
                      운영자 승인 후 대시보드로 이동합니다. 안내 화면 보기 →
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      <div className="mt-10 text-center">
        <form action="/m/logout" method="post">
          <button
            type="submit"
            className="text-sm font-medium text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
          >
            로그아웃
          </button>
        </form>
      </div>
    </div>
  );
}
