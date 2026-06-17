import { OpsConsoleFrame } from "@/components/ops/ops-console-frame";
import { OpsMerchantRemoveMembershipForm } from "@/components/ops/ops-merchant-remove-membership-form";
import { OpsMerchantShareUrls } from "@/components/ops/ops-merchant-share-urls";
import { merchantLoginUrl } from "@/lib/merchant/merchant-access";
import { merchantLoginUsesSms } from "@/lib/merchant/merchant-login-mode";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";

import {
  approveMerchantMembershipFromOps,
  inviteMerchantFromOps,
  removeMerchantMembership,
  setMerchantNotifyOrderEmailFromOps,
} from "./actions";

/** ops 다크 셸 — `[data-chaya-ops]` 밝은 글자 상속과 분리 */
const OPS_FIELD =
  "mt-1.5 w-full max-w-md rounded-lg border border-ops-border bg-ops-surface-2 px-3 py-2.5 text-sm text-ops-text outline-none transition placeholder:text-[#6B7280] focus:border-[#5B6BF8]";
const OPS_LABEL = "text-xs font-semibold text-ops-subtle";
const OPS_HINT = "mt-1 text-xs text-ops-muted";

function merchantUrlPaths(tenantSlug: string, siteBase: string | null) {
  const enc = encodeURIComponent(tenantSlug);
  const dashboardPath = `/m/${enc}/dashboard`;
  /** 로그인 후 해당 매장 대시보드로 바로 이동 — 점주 공유용 */
  const loginPath = merchantLoginUrl(dashboardPath);
  const abs = (path: string) => (siteBase ? `${siteBase}${path}` : path);
  return {
    dashboardPath,
    loginPath,
    dashboardHref: abs(dashboardPath),
    loginHref: abs(loginPath),
  };
}

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ e?: string; ok?: string; t?: string; pend?: string }>;
};

type MemberRow = {
  id: string;
  user_id: string;
  tenant_slug: string;
  role: string;
  created_at: string;
  invite_phone: string | null;
  invite_email: string | null;
  approved_at: string | null;
  notify_order_email: boolean;
};

function errText(code: string | undefined, useSms: boolean): string | null {
  if (!code) return null;
  switch (code) {
    case "bad_tenant_slug":
      return "매장 주소(슬러그)는 영문 소문자·숫자·하이픈만, 2~120자로 정해 주세요. (예: gangnam-2ho)";
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
    case "delete_not_found":
      return "삭제할 멤버십을 찾지 못했습니다.";
    case "delete_confirm":
      return "삭제 확인용 슬러그가 일치하지 않습니다. 테넌트 슬러그를 정확히 입력해 주세요.";
    case "approve_not_found":
      return "승인할 멤버십을 찾지 못했습니다.";
    case "approve_failed":
      return "승인 저장에 실패했습니다. DB 마이그레이션(approved_at 컬럼) 적용 여부를 확인해 주세요.";
    case "notify_bad_value":
      return "주문 메일 알림 설정 값이 올바르지 않습니다.";
    case "notify_update_failed":
      return "주문 메일 알림 설정 저장에 실패했습니다.";
    case "notify_not_found":
      return "해당 멤버십을 찾지 못했습니다.";
    default:
      return "처리 중 오류입니다.";
  }
}

export default async function OpsMerchantsPage({ searchParams }: Props) {
  await requirePlatformOperator("/ops/merchants");
  const useSms = merchantLoginUsesSms();
  const sp = await searchParams;
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "") || null;

  const supabase = await createSupabaseServerClient();
  let rows: MemberRow[] = [];
  let loadErr: string | null = null;
  if (supabase) {
    const { data, error } = await supabase
      .from("merchant_tenant_members")
      .select(
        "id,user_id,tenant_slug,role,created_at,invite_phone,invite_email,approved_at,notify_order_email",
      )
      .order("tenant_slug", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) loadErr = error.message ?? "목록 로드 오류";
    else rows = (data ?? []) as MemberRow[];
  } else loadErr = "Supabase 설정이 없습니다.";

  const errMsg = errText(typeof sp.e === "string" ? sp.e : undefined, useSms);
  const ok = typeof sp.ok === "string" ? sp.ok : null;
  const newTenant = typeof sp.t === "string" && sp.t.trim() ? sp.t.trim() : null;
  const tEnc = newTenant ? encodeURIComponent(newTenant) : "";
  const invitePending = sp.pend === "1";
  const successUrls = newTenant ? merchantUrlPaths(newTenant, siteBase) : null;

  return (
    <OpsConsoleFrame
      wide
      title="점주 멤버십"
      subtitle={
        useSms
          ? "점주는 문자(SMS)로 로그인합니다. Phone·Twilio 설정이 필요합니다."
          : "테스트·운영 기본: 이메일·임시 비밀번호로 계정을 만들고 `/m/login` 에서 로그인합니다."
      }
    >
      {errMsg ? (
        <p
          className="mb-4 rounded-lg border border-[rgba(240,82,82,0.35)] bg-[rgba(240,82,82,0.12)] px-3 py-2 text-sm text-[#F05252]"
          role="alert"
        >
          {errMsg}
        </p>
      ) : null}
      {ok === "1" && newTenant ? (
        <div
          className="mb-6 rounded-xl border border-[rgba(34,211,160,0.35)] bg-[rgba(34,211,160,0.1)] p-4 text-sm text-ops-text"
          role="status"
        >
          <p className="font-semibold text-[#22D3A0]">매장이 열렸습니다 — 주소는 아래와 같습니다.</p>
          <p className="mt-1 text-ops-subtle">
            슬러그 <span className="font-mono font-bold text-ops-text">{newTenant}</span> 로 손님·점주 화면이 나뉩니다. 점주에게 임시 비밀번호와 함께 알려 주세요.
          </p>
          <ul className="mt-3 space-y-2 font-mono text-xs text-ops-subtle sm:text-sm">
            <li>
              손님 메뉴판:{" "}
              {siteBase ? (
                <a
                  className="break-all text-[#5B6BF8] underline underline-offset-2"
                  href={`${siteBase}/t/${tEnc}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {siteBase}/t/{newTenant}
                </a>
              ) : (
                <span className="break-all text-ops-text">/t/{newTenant}</span>
              )}
            </li>
            {successUrls ? (
              <li>
                <span className="font-semibold text-ops-muted">점주 URL</span>
                <div className="mt-1.5">
                  <OpsMerchantShareUrls
                    tenantSlug={newTenant}
                    loginUrl={successUrls.loginHref}
                    dashboardUrl={successUrls.dashboardHref}
                  />
                </div>
              </li>
            ) : null}
          </ul>
          {!siteBase ? (
            <p className="mt-2 text-xs text-ops-muted">
              전체 URL을 보이려면 Vercel에 <span className="font-mono text-ops-subtle">NEXT_PUBLIC_SITE_URL</span> 을 넣고 재배포하세요. 지금은 경로만 표시합니다.
            </p>
          ) : null}
          <p className="mt-3 text-xs text-ops-muted">
            점주에게는 <strong className="text-ops-subtle">점주 로그인 (공유)</strong> 링크와 임시 비밀번호를 함께 보내세요. 로그인하면 해당 매장 대시보드로
            이동합니다.
          </p>
          {invitePending ? (
            <p className="mt-3 rounded-lg border border-[rgba(247,152,58,0.35)] bg-[rgba(247,152,58,0.12)] px-3 py-2 text-xs font-medium text-[#F7983A]">
              이 초대는 <strong>승인 대기</strong> 상태입니다. 아래 목록에서 해당 행의 「승인」을 누른 뒤 점주에게 로그인하라고 안내하세요. (점주는 그 전까지
              대시보드에 들어갈 수 없습니다.)
            </p>
          ) : null}
        </div>
      ) : ok === "1" ? (
        <p className="mb-4 rounded-lg border border-[rgba(34,211,160,0.35)] bg-[rgba(34,211,160,0.1)] px-3 py-2 text-sm text-[#22D3A0]">
          새 점주 계정을 만들고 매장과 연결했습니다.
        </p>
      ) : null}
      {ok === "removed" ? (
        <p className="mb-4 rounded-lg border border-[rgba(34,211,160,0.35)] bg-[rgba(34,211,160,0.1)] px-3 py-2 text-sm text-[#22D3A0]">
          멤버십 행을 삭제했습니다. (Auth 사용자 자체는 Supabase에서 별도로 삭제할 수 있습니다.)
        </p>
      ) : null}
      {ok === "approved" ? (
        <p className="mb-4 rounded-lg border border-[rgba(34,211,160,0.35)] bg-[rgba(34,211,160,0.1)] px-3 py-2 text-sm text-[#22D3A0]">
          멤버십을 승인했습니다. 점주에게 새로고침 후 다시 들어가 보라고 안내해 주세요.
        </p>
      ) : null}
      {ok === "approved_already" ? (
        <p className="mb-4 rounded-lg border border-ops-border bg-ops-surface-2 px-3 py-2 text-sm text-ops-subtle">
          이미 승인된 멤버십입니다.
        </p>
      ) : null}
      {ok === "notify_email" ? (
        <p className="mb-4 rounded-lg border border-[rgba(34,211,160,0.35)] bg-[rgba(34,211,160,0.1)] px-3 py-2 text-sm text-[#22D3A0]">
          신규 주문 이메일(Resend) 수신 설정을 저장했습니다.
        </p>
      ) : null}

      <section className="mb-8 rounded-xl border border-ops-border bg-ops-surface p-4 text-sm text-ops-subtle">
        <h2 className="text-base font-semibold text-ops-text">현장에서 새 매장 추가 (운영자)</h2>
        <p className="mt-2">
          별도 &quot;매장 등록&quot; 화면은 없습니다. 아래 폼에서 <strong className="text-ops-text">매장 주소(슬러그)</strong>를 정하고 점주 계정만 만들면, 그 순간 URL이 생깁니다.
        </p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>
            슬러그 예: <span className="font-mono text-ops-text">mapo-bibim-2</span> → 손님 <span className="font-mono text-ops-text">/t/mapo-bibim-2</span>, 점주{" "}
            <span className="font-mono text-ops-text">/m/mapo-bibim-2/…</span>
          </li>
          <li>한글만 입력하면 글자가 지워질 수 있으니, <strong className="text-ops-text">영문·숫자·하이픈</strong>으로 정하는 것을 권장합니다.</li>
          <li>메뉴는 소장(owner) 또는 메뉴 담당(menu_editor)이 로그인 후 <strong className="text-ops-text">메뉴 관리</strong>에서 넣습니다.</li>
          <li>
            기본은 <strong className="text-ops-text">승인 후</strong> 점주앱이 열립니다. 아래 목록에서 「승인」을 누르면 즉시 이용 가능합니다. (테스트만 할 때는 초대 폼의
            「초대 직시 접속 허용」을 켜세요.)
          </li>
        </ul>
        <p className="mt-2 text-xs text-ops-muted">
          자세한 단계·다음 기능 로드맵은 저장소 <span className="font-mono text-ops-subtle">docs/MERCHANT_FIELD_ONBOARDING.md</span> 를 참고하세요.
        </p>
      </section>

      <section className="mb-12 rounded-xl border border-ops-border bg-ops-surface p-5">
        <h2 className="text-lg font-semibold text-ops-text">새 점주 초대</h2>
        <form action={inviteMerchantFromOps} className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={OPS_LABEL} htmlFor="tm">
              매장 주소 (슬러그) — 손님·점주 URL에 쓰임
            </label>
            <input
              id="tm"
              name="tenant_slug"
              required
              maxLength={120}
              placeholder="예: gangnam-2ho"
              className={`${OPS_FIELD} font-mono`}
            />
            <p className={OPS_HINT}>
              저장 시 소문자로 바꾸고, 공백은 하이픈으로 바꾼 뒤 영문·숫자·하이픈만 남깁니다.
            </p>
          </div>
          {useSms ? (
            <div className="sm:col-span-2">
              <label className={OPS_LABEL} htmlFor="ph">
                휴대폰 번호 (예: 01012345678)
              </label>
              <input
                id="ph"
                name="phone"
                type="tel"
                required
                autoComplete="tel-national"
                placeholder="01012345678"
                className={OPS_FIELD}
              />
            </div>
          ) : (
            <>
              <div className="sm:col-span-2">
                <label className={OPS_LABEL} htmlFor="em">
                  이메일 (로그인 ID)
                </label>
                <input
                  id="em"
                  name="email"
                  type="email"
                  required
                  autoComplete="off"
                  placeholder="owner@example.com"
                  className={OPS_FIELD}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={OPS_LABEL} htmlFor="pw">
                  임시 비밀번호 (6자 이상)
                </label>
                <input
                  id="pw"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  placeholder="6자 이상"
                  className={OPS_FIELD}
                />
              </div>
            </>
          )}
          <div>
            <label className={OPS_LABEL} htmlFor="role">
              역할
            </label>
            <select id="role" name="role" className={OPS_FIELD} defaultValue="owner">
              <option value="owner">owner — 주문 + 메뉴</option>
              <option value="staff">staff — 주문만 (상태 변경)</option>
              <option value="menu_editor">menu_editor — 메뉴·품절·수정 (삭제는 소장만)</option>
              <option value="viewer">viewer — 조회 전용 (상태·푸시 구독 불가)</option>
              <option value="finance">finance — 정산·실적 조회 (권한은 viewer와 동일, 구분용)</option>
            </select>
          </div>
          <div className="sm:col-span-2 rounded-lg border border-ops-border bg-ops-surface-2 p-3">
            <label className="flex cursor-pointer items-start gap-3 text-sm text-ops-text">
              <input
                type="checkbox"
                name="approve_immediately"
                value="on"
                className="mt-1 h-4 w-4 shrink-0 rounded border-ops-border bg-ops-surface-3 accent-[#5B6BF8]"
              />
              <span>
                <span className="font-semibold">초대 직시 접속 허용</span>
                <span className="mt-0.5 block text-xs font-normal text-ops-muted">
                  체크하면 승인 절차 없이 바로 점주앱에 들어갈 수 있습니다. 현장 계약·본인 확인 전에는 끄는 것을 권장합니다.
                </span>
              </span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-[#5B6BF8] px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              계정 생성 및 연결
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ops-text">현재 연결 목록</h2>
        {loadErr ? (
          <p className="rounded-lg border border-[rgba(247,152,58,0.35)] bg-[rgba(247,152,58,0.12)] px-3 py-2 text-sm text-[#F7983A]">
            {loadErr}
          </p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ops-muted">등록된 멤버십이 없습니다.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-ops-border">
            <table className="min-w-[960px] w-full text-left text-sm text-ops-text">
              <thead className="border-b border-ops-border bg-ops-surface-2">
                <tr>
                  <th className="px-3 py-2 font-semibold text-ops-subtle">승인</th>
                  <th className="px-3 py-2 font-semibold text-ops-subtle">테넌트</th>
                  <th className="px-3 py-2 font-semibold text-ops-subtle">점주 URL</th>
                  <th className="px-3 py-2 font-semibold text-ops-subtle">역할</th>
                  <th className="px-3 py-2 font-semibold text-ops-subtle">이메일 / 휴대폰</th>
                  <th className="px-3 py-2 font-semibold text-ops-subtle">주문 메일</th>
                  <th className="px-3 py-2 font-semibold text-ops-subtle">user id</th>
                  <th className="px-3 py-2 font-semibold text-ops-subtle">생성</th>
                  <th className="px-3 py-2 font-semibold text-ops-subtle"> </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ops-border bg-ops-surface">
                {rows.map((r) => {
                  const shown = [r.invite_email, r.invite_phone].filter(Boolean).join(" · ") || "—";
                  const pendingApproval = r.approved_at == null;
                  const notifyOn =
                    typeof r.notify_order_email === "boolean" ? r.notify_order_email : true;
                  const urls = merchantUrlPaths(r.tenant_slug, siteBase);
                  return (
                    <tr key={r.id}>
                      <td className="px-3 py-2 align-top">
                        {pendingApproval ? (
                          <form action={approveMerchantMembershipFromOps} className="inline">
                            <input type="hidden" name="membership_id" value={r.id} />
                            <button
                              type="submit"
                              className="rounded-lg bg-[#5B6BF8] px-2 py-1 text-xs font-bold text-white"
                            >
                              승인
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs tabular-nums text-ops-muted">
                            {r.approved_at
                              ? new Date(r.approved_at).toLocaleString("ko-KR", {
                                  month: "numeric",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "—"}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-medium">{r.tenant_slug}</td>
                      <td className="px-3 py-2 align-top">
                        <OpsMerchantShareUrls
                          tenantSlug={r.tenant_slug}
                          loginUrl={urls.loginHref}
                          dashboardUrl={urls.dashboardHref}
                        />
                      </td>
                      <td className="px-3 py-2">{r.role}</td>
                      <td className="px-3 py-2 text-ops-subtle">{shown}</td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-medium text-ops-muted">
                            {notifyOn ? "수신함" : "수신 안 함"}
                          </span>
                          <form action={setMerchantNotifyOrderEmailFromOps} className="inline">
                            <input type="hidden" name="membership_id" value={r.id} />
                            <input type="hidden" name="notify_order_email" value={notifyOn ? "0" : "1"} />
                            <button
                              type="submit"
                              className="rounded-lg border border-ops-border bg-ops-surface-2 px-2 py-1 text-xs font-semibold text-ops-text hover:bg-ops-surface-3"
                            >
                              {notifyOn ? "끄기" : "켜기"}
                            </button>
                          </form>
                          <p className="max-w-[10rem] text-[10px] leading-snug text-ops-muted">
                            승인된 멤버·invite_email 있을 때만 Resend 대상
                          </p>
                        </div>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-ops-muted">{r.user_id}</td>
                      <td className="px-3 py-2 tabular-nums text-ops-muted">
                        {new Date(r.created_at).toLocaleString("ko-KR")}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <OpsMerchantRemoveMembershipForm
                          membershipId={r.id}
                          tenantSlug={r.tenant_slug}
                          removeAction={removeMerchantMembership}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </OpsConsoleFrame>
  );
}
