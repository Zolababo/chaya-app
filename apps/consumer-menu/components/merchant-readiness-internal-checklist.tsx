import { chayaSurfaceCardPaddedClass } from "@/components/menu-list-styles";

/** 운영·개발 전용 — `NEXT_PUBLIC_MERCHANT_INTERNAL_UI=true` 일 때만 표시. */
export function MerchantReadinessInternalChecklist() {
  return (
    <section
      className={`mt-6 ${chayaSurfaceCardPaddedClass} border-dashed border-amber-300 dark:border-amber-800`}
      aria-label="운영팀 체크"
    >
      <h2 className="text-base font-semibold text-amber-950 dark:text-amber-100">운영팀·개발 체크</h2>
      <p className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
        점주 화면에는 보이지 않습니다. 내부 UI 플래그가 켜져 있을 때만 표시됩니다.
      </p>
      <ul className="mt-3 space-y-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">
        <li>· 병행 검증표 — docs/merchant-validation-demo-20260506.md (최근 3일)</li>
        <li>· npm run stability:cycle — Consumer / Merchant / A11y PASS</li>
        <li>· npm run cert:pack --strict</li>
        <li>· docs/MERCHANT_CUTOVER_NOTICE_TEMPLATE.md 문안 확정</li>
      </ul>
    </section>
  );
}
