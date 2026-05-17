import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsumerLoginForm } from "@/components/consumer-login-form";
import { sanitizeConsumerNextPath } from "@/lib/consumer/consumer-path";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ next?: string; e?: string; claimed?: string }>;
};

function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "missing":
      return "이메일과 비밀번호를 입력해 주세요.";
    case "auth":
      return "로그인에 실패했습니다. 이메일·비밀번호를 확인해 주세요.";
    case "unconfirmed":
      return "이메일 인증이 아직 완료되지 않았습니다.";
    case "no_anon":
      return "NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인해 주세요.";
    case "rate_limit":
      return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
    case "bad_tenant":
      return "가게 주소가 올바르지 않습니다.";
    default:
      return null;
  }
}

export default async function ConsumerLoginPage({ params, searchParams }: Props) {
  const { tenant: tenantRaw } = await params;
  const tenant = normalizeTenantSlug(tenantRaw);
  if (!tenant) redirect("/");

  const sp = await searchParams;
  const safeNext =
    sanitizeConsumerNextPath(typeof sp.next === "string" ? sp.next : null, tenant) ??
    `/t/${tenant}/orders`;

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const user = await resolveServerUser(supabase);
    if (user) redirect(safeNext);
  }

  const err = errorMessage(typeof sp.e === "string" ? sp.e : undefined);
  const claimed =
    typeof sp.claimed === "string" && sp.claimed !== "0"
      ? Math.max(0, Math.trunc(Number(sp.claimed)))
      : null;

  return (
    <div className="mx-auto max-w-md space-y-6 px-4 py-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold">로그인</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {tenant} · 주문을 계정에 연결하려면 로그인하세요.
        </p>
      </div>

      {claimed != null && claimed > 0 ? (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900 dark:bg-green-950/40 dark:text-green-100"
        >
          비회원 주문 {claimed}건을 계정에 연결했습니다.
        </p>
      ) : null}

      <ConsumerLoginForm tenant={tenant} nextPath={safeNext} errorMessage={err} />

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        계정이 없으신가요?{" "}
        <Link
          href={`/t/${tenant}/signup?next=${encodeURIComponent(safeNext)}`}
          className="font-semibold text-chaya-primary underline-offset-2 hover:underline"
        >
          회원가입
        </Link>
        {" · "}
        <Link href={`/t/${tenant}`} className="font-semibold text-chaya-primary underline-offset-2 hover:underline">
          메뉴로
        </Link>
      </p>
    </div>
  );
}
