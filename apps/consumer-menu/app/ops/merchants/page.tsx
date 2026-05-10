import Link from "next/link";

import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

import { inviteMerchantFromOps, removeMerchantMembership } from "./actions";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ e?: string; ok?: string }>;
};

type MemberRow = {
  id: string;
  user_id: string;
  tenant_slug: string;
  role: string;
  created_at: string;
  invite_phone: string | null;
  invite_email: string | null;
};

function errText(code: string | undefined, useSms: boolean): string | null {
  if (!code) return null;
  switch (code) {
    case "bad_input":
      return useSms
        ? "테넌트 슬러그·휴대폰 번호(예: 01012345678)를 확인해 주세요."
        : "테넌트 슬러그·이메일·비밀번호(6자 이상)를 확인해 주세요.";
    case "no_service":
      return "서버에 SUPABASE_SERVICE_ROLE_KEY 가 없습니다.";
    case "invite_failed":
      return useSms
        ? "계정 생성에 실패했습니다. 이미 등록된 번호이거나 Phone/SMS 설정을 확인해 주세요."
        : "계정 생성에 실패했습니다. 이미 가입된 이메일이거나 비밀번호 규칙을 확인해 주세요.";
    case "insert_failed":
      return "멤버 행 저장에 실패했습니다. 같은 가게에 이미 묶여 있는 사용자일 수 있습니다.";
    case "no_session":
      return "세션 문제로 저장하지 못했습니다. 다시 로그인해 주세요.";
    case "bad_id":
      return "삭제 요청 값이 올바르지 않습니다.";
    case "delete_failed":
      return "행 삭제에 실패했습니다.";
    default:
      return "처리 중 오류입니다.";
  }
}

export default async function OpsMerchantsPage({ searchParams }: Props) {
  await requirePlatformOperator("/ops/merchants");
  const useSms = merchantLoginUsesSms();
  const sp = await searchParams;

  const supabase = await createSupabaseServerClient();
  let rows: MemberRow[] = [];
  let loadErr: string | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from("merchant_tenant_members")
      .select("id,user_id,tenant_slug,role,created_at,invite_phone,invite_email")
      .order("tenant_slug", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) loadErr = error.message ?? "목록 로드 오류";
    else rows = (data ?? []) as MemberRow[];
  } else loadErr = "Supabase 설정이 없습니다.";

  const errMsg = errText(typeof sp.e === "string" ? sp.e : undefined, useSms);
  const ok = typeof sp.ok === "string" ? sp.ok : null;

  return (
    <div className="mx-auto min-h-dvh max-w-4xl px-4 py-10 pb-[max(2.5rem,env(safe-area-inset-bottom))]">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-chaya-border pb-6 dark:border-zinc-700">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Platform</p>
          <h1 className="mt-2 text-3xl font-bold">점주 멤버십</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {useSms
              ? "점주는 문자(SMS)로 로그인합니다. Phone·Twilio 설정이 필요합니다."
              : "테스트·운영 기본: 이메일·임시 비밀번호로 계정을 만들고 `/m/login` 에서 로그인합니다. SMS는 환경변수로 전환할 수 있습니다."}
          </p>
        </div>
        <nav className="text-sm font-medium">
          <Link href="/ops" className="text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-400">
            운영 홈
          </Link>
          {" · "}
          <Link href="/ops/logout" className="text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400">
            로그아웃
          </Link>
        </nav>
      </header>

      {errMsg ? (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
          role="alert"
        >
          {errMsg}
        </p>
      ) : null}
      {ok === "1" ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          새 점주 계정을 만들고 매장과 연결했습니다.
        </p>
      ) : null}
      {ok === "removed" ? (
        <p className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
          멤버십 행을 삭제했습니다. (Auth 사용자 자체는 Supabase에서 별도로 삭제할 수 있습니다.)
        </p>
      ) : null}

      <section className="mb-12 rounded-xl border border-chaya-border bg-white p-5 dark:border-zinc-700 dark:bg-zinc-950">
        <h2 className="text-lg font-semibold">새 점주 초대</h2>
        <form action={inviteMerchantFromOps} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="tm">
              테넌트 슬러그 (예: demo)
            </label>
            <input
              id="tm"
              name="tenant_slug"
              required
              maxLength={120}
              className="mt-1 w-full max-w-md rounded-lg border border-chaya-border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
          {useSms ? (
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="ph">
                휴대폰 번호 (예: 01012345678)
              </label>
              <input
                id="ph"
                name="phone"
                type="tel"
                required
                autoComplete="tel-national"
                placeholder="01012345678"
                className="mt-1 w-full max-w-md rounded-lg border border-chaya-border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          ) : (
            <>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="em">
                  이메일 (로그인 ID)
                </label>
                <input
                  id="em"
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  className="mt-1 w-full max-w-md rounded-lg border border-chaya-border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="pw">
                  임시 비밀번호 (6자 이상)
                </label>
                <input
                  id="pw"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="mt-1 w-full max-w-md rounded-lg border border-chaya-border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
                />
              </div>
            </>
          )}
          <div>
            <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400" htmlFor="role">
              역할
            </label>
            <select
              id="role"
              name="role"
              className="mt-1 w-full max-w-xs rounded-lg border border-chaya-border px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
              defaultValue="owner"
            >
              <option value="owner">owner — 주문 + 메뉴</option>
              <option value="staff">staff — 주문만</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-indigo-900 px-5 py-2.5 text-sm font-semibold text-white dark:bg-indigo-200 dark:text-indigo-950"
            >
              계정 생성 및 연결
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">현재 연결 목록</h2>
        {loadErr ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
            {loadErr}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">등록된 멤버십이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-chaya-border dark:border-zinc-700">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead className="border-b border-chaya-border bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900">
                <tr>
                  <th className="px-3 py-2 font-semibold">테넌트</th>
                  <th className="px-3 py-2 font-semibold">역할</th>
                  <th className="px-3 py-2 font-semibold">이메일 / 휴대폰</th>
                  <th className="px-3 py-2 font-semibold">user id</th>
                  <th className="px-3 py-2 font-semibold">생성</th>
                  <th className="px-3 py-2 font-semibold"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-chaya-border bg-white dark:divide-zinc-800 dark:bg-zinc-950">
                {rows.map((r) => {
                  const shown = [r.invite_email, r.invite_phone].filter(Boolean).join(" · ") || "—";
                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2 font-medium">{r.tenant_slug}</td>
                      <td className="px-3 py-2">{r.role}</td>
                      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-300">{shown}</td>
                      <td className="px-3 py-2 font-mono text-xs text-zinc-500">{r.user_id}</td>
                      <td className="px-3 py-2 tabular-nums text-zinc-600 dark:text-zinc-400">
                        {new Date(r.created_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-3 py-2">
                        <form action={removeMerchantMembership}>
                          <input type="hidden" name="membership_id" value={r.id} />
                          <button
                            type="submit"
                            className="text-xs font-semibold text-red-600 underline-offset-2 hover:underline dark:text-red-400"
                          >
                            연결 삭제
                          </button>
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
