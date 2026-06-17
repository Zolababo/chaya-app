import Link from "next/link";

import { isMerchantInternalUiVisible } from "@/lib/merchant/merchant-internal-ui";

type Props = {
  tenantSlug: string;
};

/** 운영·개발용 안내. 점주 기본 화면에는 `NEXT_PUBLIC_MERCHANT_INTERNAL_UI=true` 일 때만 표시. */
export function MerchantPreviewBanner({ tenantSlug }: Props) {
  if (!isMerchantInternalUiVisible()) {
    return null;
  }

  const t = encodeURIComponent(tenantSlug);
  const legacyMerchantUrl = process.env.NEXT_PUBLIC_LEGACY_MERCHANT_URL?.trim() || null;

  return (
    <aside
      className="mb-6 rounded-2xl border border-amber-300/80 bg-amber-50 px-4 py-3.5 text-sm text-amber-950 shadow-sm dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-50"
      aria-label="점주 화면 안내"
    >
      <p className="font-semibold">내부 운영 미리보기</p>
      <p className="mt-1.5 leading-relaxed text-amber-900 dark:text-amber-100/95">
        URL 토큰·쿠키만으로 접속하는 상태입니다. 점주에게 &quot;지금 장사에 바로 쓰라&quot;고 소개하기 전에는{" "}
        <span className="font-mono text-[0.8rem]">docs/ARCHITECTURE.md</span> §5.1 의 체크리스트와 구분해서
        말해 주세요.
      </p>
      <p className="mt-3">
        <Link
          href={`/t/${t}`}
          className="inline-flex min-h-[44px] items-center font-medium text-chaya-primary underline-offset-4 hover:underline dark:text-amber-200"
        >
          손님 메뉴판 열기 (/t/{tenantSlug})
        </Link>
      </p>
      {legacyMerchantUrl ? (
        <p className="mt-2 text-xs text-amber-900 dark:text-amber-100/90">
          병행 운영 중이면{" "}
          <a
            href={legacyMerchantUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-2"
          >
            기존 점주 데모
          </a>
          에서도 최종 확인해 주세요.
        </p>
      ) : null}
    </aside>
  );
}
