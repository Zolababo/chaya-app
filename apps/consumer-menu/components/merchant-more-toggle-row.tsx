"use client";

import { MerchantSettingsToggle } from "@/components/merchant-settings-sheet-ui";

type Props = {
  label: string;
  description?: string;
  on: boolean;
  onToggle: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

/** Claude 목업 — 카드 내 토글 행 */
export function MerchantMoreToggleRow({
  label,
  description,
  on,
  onToggle,
  disabled,
  ariaLabel,
}: Props) {
  return (
    <div className="flex min-h-[52px] items-center justify-between gap-3 rounded-[10px] bg-[#F2F3F5] px-3.5 py-3 dark:bg-zinc-900/80">
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-[#0F1117] dark:text-zinc-50">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-[11px] font-medium text-[#9CA3AF] dark:text-zinc-400">
            {description}
          </span>
        ) : null}
      </span>
      <MerchantSettingsToggle
        on={on}
        onToggle={onToggle}
        disabled={disabled}
        ariaLabel={ariaLabel ?? label}
      />
    </div>
  );
}
