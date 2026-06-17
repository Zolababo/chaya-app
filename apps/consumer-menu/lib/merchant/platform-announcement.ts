export type AnnouncementType = "urgent" | "notice" | "update" | "event";

export type PlatformAnnouncement = {
  id: string;
  createdAt: string;
  type: AnnouncementType;
  title: string;
  preview: string;
  body: string;
  linkUrl: string | null;
  linkLabel: string | null;
};

export type AnnouncementTypeMeta = {
  badge: string;
  filterLabel: string;
  badgeClass: string;
};

export const ANNOUNCEMENT_TYPE_META: Record<AnnouncementType, AnnouncementTypeMeta> = {
  urgent: {
    badge: "긴급",
    filterLabel: "긴급",
    badgeClass: "bg-[#FEF2F2] text-[#DC2626]",
  },
  notice: {
    badge: "안내",
    filterLabel: "안내",
    badgeClass: "bg-[#EFF6FF] text-[#2563EB]",
  },
  update: {
    badge: "업데이트",
    filterLabel: "업데이트",
    badgeClass: "bg-[#E8F7EF] text-[#1A9E5C]",
  },
  event: {
    badge: "이벤트",
    filterLabel: "이벤트",
    badgeClass: "bg-[#F5F3FF] text-[#7C3AED]",
  },
};

export type AnnouncementFilter = "all" | AnnouncementType;

const VALID_TYPES = new Set<AnnouncementType>(["urgent", "notice", "update", "event"]);

function parseAnnouncementType(
  summary: string,
  payload: Record<string, unknown> | null,
): AnnouncementType {
  const raw = payload?.announcementType;
  if (typeof raw === "string" && VALID_TYPES.has(raw as AnnouncementType)) {
    return raw as AnnouncementType;
  }
  const text = `${summary}\n${typeof payload?.fullText === "string" ? payload.fullText : ""}`;
  if (/^\s*(\[긴급\]|🚨)/m.test(text)) return "urgent";
  if (/^\s*(\[업데이트\]|🆕)/m.test(text)) return "update";
  if (/^\s*(\[이벤트\]|🎉)/m.test(text)) return "event";
  return "notice";
}

function firstLine(text: string): string {
  const line = text.split(/\r?\n/)[0]?.trim();
  return line || text.trim();
}

function buildPreview(body: string, max = 120): string {
  const flat = body.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, max - 1)}…`;
}

export function parsePlatformAnnouncement(row: {
  id: string;
  created_at: string;
  summary: string;
  payload: unknown;
}): PlatformAnnouncement {
  const payload =
    row.payload && typeof row.payload === "object" && !Array.isArray(row.payload)
      ? (row.payload as Record<string, unknown>)
      : null;

  const body =
    typeof payload?.fullText === "string" && payload.fullText.trim()
      ? payload.fullText.trim()
      : row.summary.trim();

  const title =
    typeof payload?.title === "string" && payload.title.trim()
      ? payload.title.trim()
      : firstLine(row.summary);

  const linkUrl =
    typeof payload?.linkUrl === "string" && payload.linkUrl.trim()
      ? payload.linkUrl.trim()
      : null;
  const linkLabel =
    typeof payload?.linkLabel === "string" && payload.linkLabel.trim()
      ? payload.linkLabel.trim()
      : linkUrl
        ? "공지 전문 보기 →"
        : null;

  return {
    id: row.id,
    createdAt: row.created_at,
    type: parseAnnouncementType(row.summary, payload),
    title,
    preview: buildPreview(body),
    body,
    linkUrl,
    linkLabel,
  };
}

/** 공지 카드용 상대 날짜 (오늘 · 어제 · 3일 전) */
export function formatAnnouncementDateLabel(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return "";

  const startOfDay = (ms: number) => {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  const dayDiff = Math.floor(
    (startOfDay(Date.now()) - startOfDay(then)) / 86_400_000,
  );

  if (dayDiff <= 0) return "오늘";
  if (dayDiff === 1) return "어제";
  if (dayDiff < 7) return `${dayDiff}일 전`;
  if (dayDiff < 14) return "1주 전";
  if (dayDiff < 30) return `${Math.floor(dayDiff / 7)}주 전`;

  return new Date(then).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
}

export function splitAnnouncementBodyParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}
