"use client";

import {
  ANNOUNCEMENT_TYPE_META,
  formatAnnouncementDateLabel,
  splitAnnouncementBodyParagraphs,
  type PlatformAnnouncement,
} from "@/lib/merchant/platform-announcement";

type Props = {
  open: boolean;
  item: PlatformAnnouncement | null;
  onClose: () => void;
};

export function MerchantAnnouncementDetailSheet({ open, item, onClose }: Props) {
  if (!open || !item) return null;

  const meta = ANNOUNCEMENT_TYPE_META[item.type];
  const paragraphs = splitAnnouncementBodyParagraphs(item.body);

  return (
    <div
      className="fixed inset-0 z-[85] bg-black/40"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="absolute inset-x-0 bottom-0 flex max-h-[78dvh] animate-[sheet-up_0.24s_ease] flex-col rounded-t-[22px] bg-white dark:bg-zinc-950"
        role="dialog"
        aria-modal="true"
        aria-labelledby="merchant-announcement-sheet-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 justify-center pt-2.5">
          <div className="h-1 w-[34px] rounded-full bg-[#E5E7EB] dark:bg-zinc-700" />
        </div>

        <div className="shrink-0 border-b border-[#F3F4F6] px-[18px] pb-3.5 pt-2.5 dark:border-zinc-800">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${meta.badgeClass}`}
              >
                {meta.badge}
              </span>
              <span className="text-xs font-semibold text-[#9CA3AF]">
                {formatAnnouncementDateLabel(item.createdAt)}
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F2F3F5] text-[13px] font-bold text-[#4B5563] dark:bg-zinc-900 dark:text-zinc-300"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
          <h2
            id="merchant-announcement-sheet-title"
            className="text-lg font-black leading-snug text-[#111827] dark:text-zinc-50"
          >
            {item.title}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto px-[18px] pb-8 pt-[18px]">
          <div className="text-sm font-medium leading-[1.8] text-[#4B5563] dark:text-zinc-300">
            {paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)} className="mb-3 last:mb-0 whitespace-pre-wrap">
                {paragraph}
              </p>
            ))}
          </div>

          {item.linkUrl ? (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-[18px] flex w-full items-center justify-center gap-1.5 rounded-[10px] bg-[#D4763A] px-4 py-3.5 text-[15px] font-extrabold text-white active:opacity-80"
            >
              {item.linkLabel ?? "공지 전문 보기 →"}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
