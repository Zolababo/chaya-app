import type { NextConfig } from "next";
import path from "path";

/** 모노레포 루트(chaya-app). Turbopack이 상위 폴더의 lockfile을 잘못 잡지 않도록 고정 */
const workspaceRoot = path.resolve(__dirname, "..", "..");

function contentSecurityPolicy(): string {
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "style-src 'self' 'unsafe-inline'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  ];
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (supabaseUrl) {
    try {
      const u = new URL(supabaseUrl);
      directives.push(`connect-src 'self' ${u.origin} wss://${u.hostname}`);
    } catch {
      directives.push("connect-src 'self' https: wss:");
    }
  } else {
    directives.push("connect-src 'self' https: wss:");
  }
  return directives.join("; ");
}

const nextConfig: NextConfig = {
  /** 스택 지문 노출 완화 (동작 동일) */
  poweredByHeader: false,
  /** 개발 시 이펙트 이중 실행 등으로 부작용 조기 발견 */
  reactStrictMode: true,
  /** 폰 사진 업로드(메뉴 이미지 server action). 기본 1MB면 저장 버튼이 동작하지 않는 것처럼 보임 */
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
    /** App Router streaming과 비호환 — Critters/beasties는 Pages Router용. 손님은 `ConsumerCriticalCss` 인라인 사용. */
    // optimizeCss: true,
    /** 탭 왕복 시 RSC 재요청 완화 — Next 15 기본 dynamic=0초라 매 클릭마다 서버 왕복 */
    staleTimes: {
      dynamic: 60,
      static: 180,
    },
  },
  turbopack: {
    root: workspaceRoot,
  },
  async headers() {
    const baseHeaders = [
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self), notifications=(self)",
      },
      {
        key: "Content-Security-Policy",
        value: contentSecurityPolicy(),
      },
    ];
    if (process.env.VERCEL_ENV === "production") {
      baseHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=63072000; includeSubDomains; preload",
      });
    }
    return [
      {
        source: "/:path*",
        headers: baseHeaders,
      },
    ];
  },
};

export default nextConfig;
