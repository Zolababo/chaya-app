import type { Viewport } from "next";

import { ConsumerLightTheme } from "@/components/consumer-light-theme";
import { ConsumerPinchZoomDeferred } from "@/components/consumer-pinch-zoom-deferred";

/** 손님 메뉴: 라이트 고정 + 핀치 줌 OFF (반응형·큰글씨 모드로 확대) */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  colorScheme: "only light",
  themeColor: "#fafaf9",
};

export default function ConsumerSegmentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ConsumerLightTheme />
      <ConsumerPinchZoomDeferred />
      {children}
    </>
  );
}
