"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

type Props = {
  href: string;
  label?: string;
  pendingLabel?: string;
  className?: string;
};

export function MerchantTableQrLink({
  href,
  label = "QR 보기",
  pendingLabel = "열는 중…",
  className = "shrink-0 rounded-lg border-[1.5px] border-[rgba(201,106,42,0.25)] bg-[#FEF0E6] px-4 py-2 text-[13px] font-extrabold text-chaya-primary disabled:opacity-70",
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-busy={pending}
      onClick={() => startTransition(() => router.push(href))}
      className={`inline-flex items-center justify-center gap-1.5 ${className}`}
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.5} aria-hidden /> : null}
      {pending ? pendingLabel : label}
    </button>
  );
}
