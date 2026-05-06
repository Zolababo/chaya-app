import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

/** OG·메타데이터 canonical. 로컬은 localhost, Vercel은 호스트 자동 반영 가능 */
function metadataSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  return "http://localhost:3000";
}

const chayaSans = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-chaya-sans",
});

export const metadata: Metadata = {
  metadataBase: new URL(metadataSiteUrl()),
  title: {
    default: "CHAYA 메뉴",
    template: "%s · CHAYA 메뉴",
  },
  description: "매장 주문 메뉴판",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${chayaSans.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
