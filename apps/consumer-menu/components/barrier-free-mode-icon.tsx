import Image from "next/image";

type Props = {
  className?: string;
};

/** ISO 7001 AC 009 — 첨부 기준 픽토그램(형태·비율 그대로). */
const AC009_SRC = "/icons/ac009-blind-low-vision.png";

export function BarrierFreeModeIcon({ className = "size-6 shrink-0" }: Props) {
  return (
    <Image
      src={AC009_SRC}
      alt=""
      width={28}
      height={28}
      className={`rounded-full object-contain ${className}`.trim()}
      aria-hidden
      unoptimized
    />
  );
}
