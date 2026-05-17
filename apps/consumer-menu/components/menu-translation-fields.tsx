import { LOCALE_META, TRANSLATION_LOCALES } from "@/lib/i18n/locales";
import { getTranslationField, type MenuTranslationsMap } from "@/lib/i18n/menu-translations";

type Props = {
  translations: MenuTranslationsMap;
  idPrefix: string;
};

export function MenuTranslationFields({ translations, idPrefix }: Props) {
  return (
    <details className="rounded-lg border border-chaya-border bg-white/50 dark:border-zinc-700 dark:bg-zinc-900/50">
      <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        다국어 이름·설명 (손님 메뉴판)
      </summary>
      <div className="space-y-4 px-3 pb-3 pt-1">
        {TRANSLATION_LOCALES.map((loc) => (
          <fieldset key={loc} className="rounded-lg border border-dashed border-zinc-300 p-3 dark:border-zinc-600">
            <legend className="px-1 text-xs font-bold text-chaya-primary dark:text-orange-400">
              {LOCALE_META[loc].nativeLabel}
            </legend>
            <label className="mt-2 block text-xs text-zinc-600 dark:text-zinc-400" htmlFor={`${idPrefix}-${loc}-name`}>
              이름
            </label>
            <input
              id={`${idPrefix}-${loc}-name`}
              name={`tr_${loc}_name`}
              maxLength={200}
              defaultValue={getTranslationField(translations, loc, "name")}
              className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
            <label
              className="mt-2 block text-xs text-zinc-600 dark:text-zinc-400"
              htmlFor={`${idPrefix}-${loc}-desc`}
            >
              설명
            </label>
            <textarea
              id={`${idPrefix}-${loc}-desc`}
              name={`tr_${loc}_description`}
              rows={2}
              maxLength={2000}
              defaultValue={getTranslationField(translations, loc, "description")}
              className="mt-1 w-full rounded-lg border border-chaya-border bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            />
          </fieldset>
        ))}
        <p className="text-xs text-zinc-500">비우면 손님 화면에 한국어(기본 이름)가 표시됩니다.</p>
      </div>
    </details>
  );
}
