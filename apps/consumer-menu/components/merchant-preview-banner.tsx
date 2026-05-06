import Link from "next/link";

type Props = {
  tenantSlug: string;
};

/** 대외 「영업 도입 홍보」와 구분하기 위한 안내 — docs/ARCHITECTURE.md §5.1 과 정합 */
export function MerchantPreviewBanner({ tenantSlug }: Props) {
  const t = encodeURIComponent(tenantSlug);

  return (
    <aside
      className="mb-6 rounded-xl border border-amber-300/90 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/45 dark:text-amber-50"
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
    </aside>
  );
}
