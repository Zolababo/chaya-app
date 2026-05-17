import { NextResponse } from "next/server";

import { probeGuestOrderRpcsForHealth } from "@/lib/health/probe-guest-order-rpcs";
import { MERCHANT_ROLES } from "@/lib/merchant/merchant-access";
import {
  getSupabaseServiceRoleKey,
  getSupabaseServiceUrl,
  isServiceSupabaseConfigured,
} from "@/lib/supabase/resolve-service-config";

/** 배포·모니터링용 헬스 체크 (인증 없음). Supabase URL·키 값은 노출하지 않습니다. */
export async function GET() {
  const publicUrl = getSupabaseServiceUrl();
  const hasSupabaseUrl = Boolean(publicUrl);
  const hasSupabaseAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const serviceRoleSecret = getSupabaseServiceRoleKey();

  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA?.trim() ?? null;
  const vercelEnv = process.env.VERCEL_ENV?.trim() ?? null;

  const guestOrderRpcsProbe = await probeGuestOrderRpcsForHealth();

  const res = NextResponse.json(
    {
      ok: true,
      service: "consumer-menu",
      ts: new Date().toISOString(),
      deployment: vercelSha || vercelEnv ? { env: vercelEnv, gitCommitSha: vercelSha } : undefined,
      supabase: {
        configured: hasSupabaseUrl && hasSupabaseAnon,
        hasUrl: hasSupabaseUrl,
        hasAnonKey: hasSupabaseAnon,
        /** 점주 `/m/*` DB 접근(주문·메뉴). URL+service_role 둘 다 있어야 true (비밀 값은 미포함). */
        merchantDbReady: isServiceSupabaseConfigured(),
        merchantDb: {
          hasProjectUrl: hasSupabaseUrl,
          hasServiceRoleKey: Boolean(serviceRoleSecret),
        },
        /**
         * 손님 주문 RPC 3종이 DB에 있고 서비스 롤로 호출 가능한지(가짜 id·세션, 부작용 없음).
         * 부하·외부 모니터 주기가 매우 짧으면 `CHAYA_HEALTH_SKIP_GUEST_RPC_PROBE=1` 로 끌 수 있습니다.
         */
        guestOrderRpcsProbe,
        /** Phase 3: outbound order notify (no secret values). */
        merchantOrderEmail: {
          resendConfigured: Boolean(
            process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim(),
          ),
          siteUrlForMailLinks: Boolean(
            process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
              process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() ||
              process.env.VERCEL_URL?.trim(),
          ),
        },
        merchantWebPush: {
          vapidConfigured: Boolean(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
              process.env.VAPID_PRIVATE_KEY?.trim() &&
              process.env.VAPID_SUBJECT?.trim(),
          ),
        },
        merchantOrderNotifyWebhook: {
          urlConfigured: Boolean(process.env.MERCHANT_ORDER_NOTIFY_WEBHOOK_URL?.trim()),
        },
        /** 앱이 이해하는 점주 역할(비밀 없음). DB `role` CHECK는 아래 마이그레이션 적용 후 5종 모두 허용됩니다. */
        merchantMemberRoles: {
          supportedInApp: [...MERCHANT_ROLES],
          dbCheckMigrations: [
            "20260513190000_merchant_tenant_members_phase4_roles.sql",
            "20260514100000_merchant_tenant_members_finance_role.sql",
          ],
        },
      },
    },
    { status: 200 },
  );
  res.headers.set("Cache-Control", "no-store");
  return res;
}
