type Props = {
  kind: "error" | "ok" | "warn";
  children: React.ReactNode;
};

const toneClass = {
  error:
    "border-red-200/80 bg-[#FEF2F2] text-[#B91C1C] dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100",
  ok: "border-emerald-200/80 bg-[#E6F7EE] text-[#047857] dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100",
  warn: "border-amber-200/80 bg-[#FFFBEB] text-[#B45309] dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
};

export function MerchantMoreFlash({ kind, children }: Props) {
  return (
    <p
      role={kind === "error" ? "alert" : "status"}
      className={`mb-3.5 rounded-[10px] border px-3.5 py-2.5 text-sm font-semibold ${toneClass[kind]}`}
    >
      {children}
    </p>
  );
}
