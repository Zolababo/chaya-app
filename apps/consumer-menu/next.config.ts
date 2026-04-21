import type { NextConfig } from "next";
import path from "path";

/** 모노레포 루트(chaya-app). Turbopack이 상위 폴더의 lockfile을 잘못 잡지 않도록 고정 */
const workspaceRoot = path.resolve(__dirname, "..", "..");

const nextConfig: NextConfig = {
  /** 스택 지문 노출 완화 (동작 동일) */
  poweredByHeader: false,
  /** 개발 시 이펙트 이중 실행 등으로 부작용 조기 발견 */
  reactStrictMode: true,
  turbopack: {
    root: workspaceRoot,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
