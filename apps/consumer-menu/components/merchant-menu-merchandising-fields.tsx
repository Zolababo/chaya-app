type Props = {
  idPrefix: string;
  defaultTodaysPick?: boolean;
  defaultStoreRecommended?: boolean;
};

/** 점주 메뉴 등록·수정 — 손님 화면 노출 플래그 */
export function MerchantMenuMerchandisingFields({
  idPrefix,
  defaultTodaysPick = false,
  defaultStoreRecommended = false,
}: Props) {
  return (
    <div className="sm:col-span-2 flex flex-col gap-2 rounded-xl border border-chaya-border/80 bg-zinc-50/80 p-3 dark:border-zinc-700 dark:bg-zinc-900/50">
      <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">메뉴판 상단에 강조 표시</p>
      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          id={`${idPrefix}-todays-pick`}
          name="is_todays_pick"
          type="checkbox"
          value="on"
          defaultChecked={defaultTodaysPick}
          className="mt-0.5 h-4 w-4 rounded border-chaya-border"
        />
        <span>
          <span className="font-medium">오늘의 메뉴</span>
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            손님 메뉴 맨 위 배너 (최대 3개)
          </span>
        </span>
      </label>
      <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          id={`${idPrefix}-store-rec`}
          name="is_store_recommended"
          type="checkbox"
          value="on"
          defaultChecked={defaultStoreRecommended}
          className="mt-0.5 h-4 w-4 rounded border-chaya-border"
        />
        <span>
          <span className="font-medium">사장님 Pick (대표)</span>
          <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
            목록에 「대표」 표시
          </span>
        </span>
      </label>
    </div>
  );
}
