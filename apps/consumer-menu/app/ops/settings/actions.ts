"use server";

import { revalidatePath } from "next/cache";

import {
  sendPlatformAnnouncement,
  type PlatformAnnouncementTarget,
} from "@/lib/platform/send-platform-announcement";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

const TARGET_MAP: Record<string, PlatformAnnouncementTarget> = {
  "전체 매장": "all",
  "영업중만": "active",
  "위험 매장": "at_risk",
  "신규 매장": "new",
};

export type SendNoticeState =
  | { ok: true; sentCount: number; targetLabel: string }
  | { ok: false; message: string }
  | null;

export async function sendPlatformNoticeAction(
  _prev: SendNoticeState,
  formData: FormData,
): Promise<SendNoticeState> {
  const { userId } = await requirePlatformOperator("/ops/settings");

  const targetLabel = String(formData.get("target") ?? "").trim();
  const target = TARGET_MAP[targetLabel] ?? "all";
  const body = String(formData.get("body") ?? "").trim();

  const result = await sendPlatformAnnouncement({
    actorUserId: userId,
    target,
    body,
  });

  if (!result.ok) {
    return { ok: false, message: result.message };
  }

  revalidatePath("/ops/settings");
  for (const path of ["/ops/dashboard", "/ops/stores"]) {
    revalidatePath(path);
  }

  return {
    ok: true,
    sentCount: result.sentCount,
    targetLabel,
  };
}
