"use server";

import { sanitizeGuestSessionId, sanitizeTenantSlug } from "@/lib/orders/guest-order-validation";
import { createServiceSupabase } from "@/lib/supabase/create-service-client";

export type ExperienceEventType = "qr_scan" | "menu_view" | "order_placed" | "revisit";

export type TrackExperienceEventInput = {
  guestSessionId: string;
  tenantSlug: string;
  eventType: ExperienceEventType;
  menuId?: string | null;
  dwellSeconds?: number | null;
  metadata?: Record<string, unknown> | null;
};

function parseMenuId(raw: string | null | undefined): string | null {
  if (raw == null) return null;
  const s = raw.trim().slice(0, 128);
  return s.length > 0 ? s : null;
}

async function insertExperienceRow(
  client: NonNullable<ReturnType<typeof createServiceSupabase>>,
  row: {
    guest_session_id: string;
    tenant_slug: string;
    event_type: ExperienceEventType;
    menu_id?: string | null;
    dwell_seconds?: number | null;
    metadata?: Record<string, unknown> | null;
  },
): Promise<void> {
  const { error } = await client.from("consumer_experience_events").insert({
    guest_session_id: row.guest_session_id,
    tenant_slug: row.tenant_slug,
    event_type: row.event_type,
    menu_id: row.menu_id ?? null,
    dwell_seconds:
      row.dwell_seconds != null && Number.isFinite(row.dwell_seconds)
        ? Math.max(0, Math.min(86400, Math.floor(row.dwell_seconds)))
        : null,
    metadata: row.metadata ?? null,
  });
  if (error) {
    console.error("[trackExperienceEvent]", row.event_type, error.code ?? "", error.message);
  }
}

/** 경험 추적 실패는 메인 UX에 영향 없음 — silent fail */
export async function trackExperienceEvent(input: TrackExperienceEventInput): Promise<void> {
  const guest_session_id = sanitizeGuestSessionId(input.guestSessionId);
  const tenantCheck = sanitizeTenantSlug(input.tenantSlug.trim());
  if (!guest_session_id || !tenantCheck.ok) return;

  const client = createServiceSupabase();
  if (!client) return;

  const tenant_slug = tenantCheck.slug;
  const menu_id = parseMenuId(input.menuId);

  try {
    if (input.eventType === "qr_scan") {
      const { count, error: countErr } = await client
        .from("consumer_experience_events")
        .select("id", { count: "exact", head: true })
        .eq("guest_session_id", guest_session_id)
        .eq("tenant_slug", tenant_slug)
        .eq("event_type", "qr_scan");

      if (!countErr && (count ?? 0) > 0) {
        await insertExperienceRow(client, {
          guest_session_id,
          tenant_slug,
          event_type: "revisit",
        });
      }
    }

    await insertExperienceRow(client, {
      guest_session_id,
      tenant_slug,
      event_type: input.eventType,
      menu_id,
      dwell_seconds: input.dwellSeconds,
      metadata: input.metadata,
    });
  } catch (e) {
    console.error("[trackExperienceEvent]", e);
  }
}
