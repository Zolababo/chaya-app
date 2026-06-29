import type { Metadata, Viewport } from "next";

import {
  chayaMerchantPwaBrand,
  chayaPwaMetadataIcons,
} from "@/lib/pwa/chaya-pwa-brand";

export const metadata: Metadata = {
  applicationName: "CHAYA 점주",
  icons: chayaPwaMetadataIcons(chayaMerchantPwaBrand.icon),
  appleWebApp: {
    capable: true,
    title: "CHAYA 점주",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: chayaMerchantPwaBrand.themeColor,
};

export default function MerchantRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
