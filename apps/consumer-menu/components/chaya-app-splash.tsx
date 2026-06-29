"use client";

import { useEffect, useState } from "react";

import {
  chayaConsumerPwaBrand,
  chayaMerchantPwaBrand,
} from "@/lib/pwa/chaya-pwa-brand";

type Props = {
  variant: "consumer" | "merchant";
};

const SPLASH_MIN_MS = 550;
const SPLASH_FADE_MS = 280;
const SPLASH_ONCE_KEY = "chaya_consumer_splash_done";

export function ChayaAppSplash({ variant }: Props) {
  const [phase, setPhase] = useState<"show" | "fade" | "hidden">(() => {
    if (typeof window === "undefined") return "show";
    return sessionStorage.getItem(SPLASH_ONCE_KEY) === "1" ? "hidden" : "show";
  });

  const brand = variant === "consumer" ? chayaConsumerPwaBrand : chayaMerchantPwaBrand;

  useEffect(() => {
    if (phase === "hidden") return;

    try {
      sessionStorage.setItem(SPLASH_ONCE_KEY, "1");
    } catch {
      /* ignore */
    }

    const started = Date.now();
    let fadeTimer: number | undefined;
    let hideTimer: number | undefined;

    const finish = () => {
      const wait = Math.max(0, SPLASH_MIN_MS - (Date.now() - started));
      fadeTimer = window.setTimeout(() => {
        setPhase("fade");
        hideTimer = window.setTimeout(() => setPhase("hidden"), SPLASH_FADE_MS);
      }, wait);
    };

    if (document.readyState === "complete") finish();
    else window.addEventListener("load", finish, { once: true });

    return () => {
      window.removeEventListener("load", finish);
      if (fadeTimer !== undefined) window.clearTimeout(fadeTimer);
      if (hideTimer !== undefined) window.clearTimeout(hideTimer);
    };
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      className={[
        "fixed inset-0 z-[10000] flex items-center justify-center transition-opacity duration-300",
        phase === "fade" ? "pointer-events-none opacity-0" : "opacity-100",
      ].join(" ")}
      style={{ backgroundColor: brand.backgroundColor }}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={brand.icon}
        alt=""
        width={512}
        height={512}
        className="h-auto w-[min(44vw,11rem)] max-w-[180px] select-none"
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}
