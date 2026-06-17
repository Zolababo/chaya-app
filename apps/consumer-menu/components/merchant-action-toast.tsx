"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

type Props = {
  message: string;
  kind: "ok" | "error";
};

/**
 * 점주 액션 결과 — 3초 후 자동으로 사라지는 토스트.
 * URL에서 ?ok= / ?e= 파라미터도 함께 제거.
 */
export function MerchantActionToast({ message, kind }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setVisible(false), 2800);
    const removeTimer = window.setTimeout(() => {
      router.replace(pathname);
    }, 3200);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, [router, pathname]);

  if (!visible) return null;

  const colorClass =
    kind === "error"
      ? "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100"
      : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";

  return (
    <div
      role={kind === "error" ? "alert" : "status"}
      aria-live={kind === "error" ? "assertive" : "polite"}
      className={[
        "mb-3 rounded-lg border px-3 py-2.5 text-sm font-semibold",
        "transition-opacity duration-500",
        visible ? "opacity-100" : "opacity-0",
        colorClass,
      ].join(" ")}
    >
      {message}
    </div>
  );
}
