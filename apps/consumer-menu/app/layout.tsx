import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import { ConsumerCriticalCss } from "@/components/consumer-critical-css";
import { consumerLightBootScript } from "@/lib/consumer/consumer-light-boot-script";

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
  display: "swap",
  variable: "--font-chaya-sans",
});

/** 손님 `/t/*` — weight·preload 축소, optional로 첫 paint 경쟁 완화 */
const chayaSansConsumer = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "optional",
  preload: false,
  variable: "--font-chaya-sans-consumer",
});

export const metadata: Metadata = {
  metadataBase: new URL(metadataSiteUrl()),
  title: {
    default: "CHAYA 메뉴",
    template: "%s · CHAYA 메뉴",
  },
  description: "매장 주문 메뉴판",
  /** 홈 화면 추가 시 짧은 이름(소비자 `/t/*`·점주 `/m/*`·`/ops` 공통). */
  applicationName: "CHAYA",
  appleWebApp: {
    capable: true,
    title: "CHAYA",
    statusBarStyle: "default",
  },
};

/** 모바일 브라우저·노치 영역(safe-area는 컴포넌트에서 이미 사용) 대응 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf9f8" },
    { media: "(prefers-color-scheme: dark)", color: "#18181b" },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isConsumerMenu = (await headers()).get("x-chaya-consumer") === "1";

  return (
    <html
      lang="ko"
      {...(isConsumerMenu ? { "data-chaya-consumer": "" } : {})}
      style={isConsumerMenu ? { colorScheme: "only light" } : undefined}
      suppressHydrationWarning
    >
      <head>
        {isConsumerMenu ? <meta name="color-scheme" content="only light" /> : null}
        {isConsumerMenu ? <ConsumerCriticalCss /> : null}
      </head>
      <body
        className={`${isConsumerMenu ? chayaSansConsumer.variable : chayaSans.variable} touch-manipulation font-sans antialiased`}
      >
        {children}
        {isConsumerMenu ? (
          <script
            id="chaya-consumer-light-boot"
            dangerouslySetInnerHTML={{ __html: consumerLightBootScript }}
          />
        ) : null}
      </body>
    </html>
  );
}
