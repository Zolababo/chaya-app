"use client";

import { useEffect, useState } from "react";
import { Smartphone, Tablet } from "lucide-react";

import { detectMerchantDeviceInfo } from "@/lib/merchant/detect-merchant-device";
import { merchantSubCardClass } from "@/lib/merchant/merchant-more-sub-styles";

type Props = {
  loginEmail: string | null;
};

function guessDeviceIcon(label: string): "phone" | "tablet" {
  if (/iPad|Tablet|Tab/i.test(label)) return "tablet";
  return "phone";
}

export function MerchantDeviceManagement({ loginEmail }: Props) {
  const [icon, setIcon] = useState<"phone" | "tablet">("phone");
  const [deviceLabel, setDeviceLabel] = useState("이 기기");
  const [deviceMeta, setDeviceMeta] = useState<string | null>(null);

  useEffect(() => {
    void detectMerchantDeviceInfo().then((info) => {
      setDeviceLabel(info.label);
      setDeviceMeta(info.meta);
      setIcon(guessDeviceIcon(info.label));
    });
  }, []);

  return (
    <div className="space-y-3">
      <section className={merchantSubCardClass} aria-label="로그인 기기">
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#EFF6FF] text-[#2563EB]">
            {icon === "tablet" ? (
              <Tablet className="h-5 w-5" strokeWidth={2} aria-hidden />
            ) : (
              <Smartphone className="h-5 w-5" strokeWidth={2} aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-[#111827] dark:text-zinc-50">{deviceLabel}</p>
            {loginEmail ? (
              <p className="truncate text-xs font-medium text-[#9CA3AF]">{loginEmail}</p>
            ) : null}
            {deviceMeta ? (
              <p className="truncate text-[11px] font-medium text-[#9CA3AF]">{deviceMeta}</p>
            ) : null}
          </div>
          <span className="shrink-0 rounded-full bg-[#E8F7EF] px-2 py-0.5 text-[11px] font-bold text-[#1A9E5C]">
            이 기기
          </span>
        </div>
      </section>
    </div>
  );
}
