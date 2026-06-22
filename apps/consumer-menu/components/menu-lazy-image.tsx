"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  /** render/image 실패 시 원본 public URL */
  fallbackSrc?: string;
  className?: string;
  /** 첫 화면·캐러셀 첫 슬라이드 등 */
  priority?: boolean;
};

/** 메뉴 썸네일 — lazy decode로 첫 paint 가속 */
export function MenuLazyImage({ src, fallbackSrc, className, priority = false }: Props) {
  const [resolved, setResolved] = useState(src);

  useEffect(() => {
    setResolved(src);
  }, [src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved}
      alt=""
      className={className}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      onError={() => {
        if (fallbackSrc && resolved !== fallbackSrc) {
          setResolved(fallbackSrc);
        }
      }}
    />
  );
}
