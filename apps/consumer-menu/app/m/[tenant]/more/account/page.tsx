import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail } from "lucide-react";

import { MerchantAccountPasswordForm } from "@/components/merchant-account-password-form";
import { MerchantMoreFlash } from "@/components/merchant-more-flash";
import { MerchantMoreSubPageBack } from "@/components/merchant-more-sub-page-back";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { accountPasswordErrorMessage } from "@/lib/merchant/merchant-password-auth";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ e?: string; ok?: string }>;
};

export default async function MerchantMoreAccountPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  await requireMerchantForTenant(tenant);

  if (merchantLoginUsesSms()) {
    redirect(`/m/${encodeURIComponent(tenant)}/more?e=sms_no_password`);
  }

  const sp = await searchParams;
  const err = accountPasswordErrorMessage(typeof sp.e === "string" ? sp.e : undefined);
  const ok = sp.ok === "password_changed";

  const supabase = await createSupabaseServerClient();
  const user = supabase ? await resolveServerUser(supabase) : null;
  const email = user?.email?.trim() ?? null;

  const tEnc = encodeURIComponent(tenant);

  return (
    <MerchantMoreSubPageShell>
      <MerchantMoreSubPageBack href={`/m/${tEnc}/more`} label="비밀번호 변경" />

      {ok ? <MerchantMoreFlash kind="ok">비밀번호를 변경했습니다.</MerchantMoreFlash> : null}
      {err ? <MerchantMoreFlash kind="error">{err}</MerchantMoreFlash> : null}

      {email ? (
        <div className="flex items-center gap-3 rounded-[10px] border border-[#E5E7EB] bg-[#F2F3F5] px-4 py-4 dark:border-zinc-700 dark:bg-zinc-900/80">
          <Mail className="h-5 w-5 shrink-0 text-[#9CA3AF]" strokeWidth={2} aria-hidden />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#9CA3AF]">로그인 이메일</p>
            <p className="truncate font-mono text-sm font-bold text-[#111827] dark:text-zinc-50">{email}</p>
          </div>
        </div>
      ) : null}

      <MerchantAccountPasswordForm tenant={tenant} />

      <p className="mt-2 text-center text-sm font-medium text-[#9CA3AF]">
        <Link href="/m/forgot-password" className="font-bold text-chaya-primary underline-offset-4 hover:underline">
          비밀번호를 잊었습니다
        </Link>
      </p>
    </MerchantMoreSubPageShell>
  );
}
