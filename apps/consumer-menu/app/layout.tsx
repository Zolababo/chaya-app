import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const chayaSans = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-chaya-sans",
});

export const metadata: Metadata = {
  title: "CHAYA 메뉴",
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
