import { ConsumerStoreLogo } from "@/components/consumer-store-logo";

type Props = {
  displayName: string;
  logoUrl?: string | null;
  /** 손님 헤더 `tableBadge` 형식 — 예: "01" → "테이블 01" */
  tableCode?: string | null;
  tableBadgeTemplate?: string;
};

/** 점주 설정 등 — 손님 `SessionHeader` 레이아웃과 동일한 미리보기 */
export function ConsumerSessionHeaderPreview({
  displayName,
  logoUrl,
  tableCode = "01",
  tableBadgeTemplate = "테이블 {table}",
}: Props) {
  const tableBadgeLabel =
    tableCode?.trim() ?
      tableBadgeTemplate.replace("{table}", tableCode.trim())
    : null;

  return (
    <div className="flex items-center gap-2.5 sm:gap-3">
      <ConsumerStoreLogo
        displayName={displayName}
        logoUrl={logoUrl}
        sizeClass="h-10 w-10"
        shape="circle"
        fallback="initial"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-extrabold leading-tight tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-[1.35rem]">
          {displayName}
        </p>
        {tableBadgeLabel ? (
          <p className="mt-0.5 truncate text-sm font-bold text-chaya-primary dark:text-orange-400">
            {tableBadgeLabel}
          </p>
        ) : null}
      </div>
    </div>
  );
}
