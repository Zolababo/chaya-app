import Link from "next/link";
import { redirect } from "next/navigation";

import { ConsumerSignupForm } from "@/components/consumer-signup-form";
import { chayaConsumerContentClass } from "@/lib/responsive/chaya-app-shell";
import { sanitizeConsumerNextPath } from "@/lib/consumer/consumer-path";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";
import { normalizeTenantSlug } from "@/lib/tenant/tenant-slug";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ next?: string; e?: string }>;
};

function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "missing":
      return "이메일과 비밀번호를 입력해 주세요.";
    case "weak_password":
      return "비밀번호는 8자 이상이어야 합니다.";
    case "signup":
      return "가입에 실패했습니다. 이미 가입된 이메일이거나 비밀번호 규칙을 확인해 주세요.";
    case "no_anon":
      return "NEXT_PUBLIC_SUPABASE_URL·NEXT_PUBLIC_SUPABASE_ANON_KEY 를 확인해 주세요.";
    case "rate_limit":
      return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
    default:
      return null;
  }
}

export default async function ConsumerSignupPage({ params, searchParams }: Props) {
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

  return (
    <div className={`${chayaConsumerContentClass} space-y-6 py-8`}>
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">회원가입</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {tenant} · 주문 내역을 계정으로 모으려면 가입하세요.
        </p>
      </div>

      <ConsumerSignupForm tenant={tenant} nextPath={safeNext} errorMessage={err} />

      <p className="text-center text-sm">
        <Link href={`/t/${tenant}`} className="font-semibold text-chaya-primary underline-offset-2 hover:underline">
          메뉴로 돌아가기
        </Link>
      </p>
    </div>
  );
}
