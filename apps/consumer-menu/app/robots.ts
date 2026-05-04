import type { MetadataRoute } from "next";

/** 점주 화면은 인덱싱하지 않고, 손님 `/t/…` 위주로 노출되게 합니다. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/m/", "/m"],
      },
    ],
  };
}
