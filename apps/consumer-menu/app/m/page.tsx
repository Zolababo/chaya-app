import Link from "next/link";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export const dynamic = "force-dynamic";

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
    .select("tenant_slug, role")
    .order("tenant_slug", { ascending: true });

  if (error || !rows?.length) {
    redirect("/m/forbidden");
  }

  const list = rows as { tenant_slug: string; role: string }[];
  if (list.length === 1) {
    redirect(`/m/${encodeURIComponent(list[0].tenant_slug)}/orders`);
  }

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Merchant</p>
        <h1 className="mt-2 text-2xl font-bold">가게 선택</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          접근 가능한 가게가 여러 개입니다. 하나를 선택해 주세요.
        </p>
      </header>
      <ul className="space-y-3">
        {list.map((r) => {
          const t = encodeURIComponent(r.tenant_slug);
          return (
            <li key={r.tenant_slug}>
              <Link
                href={`/m/${t}/orders`}
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
