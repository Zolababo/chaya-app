import { createServiceSupabase } from "@/lib/supabase/create-service-client";
import { isServiceSupabaseConfigured } from "@/lib/supabase/resolve-service-config";

const NIL_ORDER = "00000000-0000-0000-0000-000000000000";
const FAKE_TENANT = "__chaya_health__";
/** `list_orders_for_guest` 는 세션 길이 8–128자만 허용 */
const FAKE_SESSION = "chaya_hlth";

export type GuestOrderRpcsProbe =
  | { probed: false; skipReason: "merchant_db_not_configured" | "skipped_by_env" | "no_client" }
  | {
      probed: true;
      /** 세 RPC 모두 오류 없이 호출됐을 때만 true */
      allPresent: boolean;
      rpcs: {
        get_order_status_for_guest: "ok" | "error";
        list_orders_for_guest: "ok" | "error";
        get_order_for_guest: "ok" | "error";
      };
      durationMs: number;
      /** 첫 실패 메시지 앞부분(비밀 없음, 디버그용) */
      firstError?: string;
    };

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

/**
 * `/health` 전용. 존재하지 않는 주문·세션으로 RPC만 “살아 있는지” 확인합니다(읽기 전용·부작용 없음).
 * 서버에서만 호출하세요.
 */
export async function probeGuestOrderRpcsForHealth(): Promise<GuestOrderRpcsProbe> {
  if (!isServiceSupabaseConfigured()) {
    return { probed: false, skipReason: "merchant_db_not_configured" };
  }
  if (process.env.CHAYA_HEALTH_SKIP_GUEST_RPC_PROBE?.trim() === "1") {
    return { probed: false, skipReason: "skipped_by_env" };
  }

  const supabase = createServiceSupabase();
  if (!supabase) {
    return { probed: false, skipReason: "no_client" };
  }

  const t0 = Date.now();

  const [statusRes, listRes, detailRes] = await Promise.all([
    supabase.rpc("get_order_status_for_guest", {
      p_order_id: NIL_ORDER,
      p_tenant_slug: FAKE_TENANT,
      p_guest_session_id: null,
    }),
    supabase.rpc("list_orders_for_guest", {
      p_tenant_slug: "demo",
      p_guest_session_id: FAKE_SESSION,
      p_limit: 5,
    }),
    supabase.rpc("get_order_for_guest", {
      p_order_id: NIL_ORDER,
      p_tenant_slug: FAKE_TENANT,
      p_guest_session_id: null,
    }),
  ]);

  const durationMs = Date.now() - t0;

  const sOk = !statusRes.error;
  const lOk = !listRes.error;
  const dOk = !detailRes.error;

  const firstMsg =
    statusRes.error?.message ?? listRes.error?.message ?? detailRes.error?.message ?? "";

  return {
    probed: true,
    allPresent: sOk && lOk && dOk,
    rpcs: {
      get_order_status_for_guest: sOk ? "ok" : "error",
      list_orders_for_guest: lOk ? "ok" : "error",
      get_order_for_guest: dOk ? "ok" : "error",
    },
    durationMs,
    ...(firstMsg ? { firstError: truncate(firstMsg, 220) } : {}),
  };
}
