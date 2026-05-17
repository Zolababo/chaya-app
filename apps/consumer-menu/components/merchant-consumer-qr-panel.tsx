"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

type Props = {
  tenantSlug: string;
  /** `NEXT_PUBLIC_SITE_URL` 등. 없으면 경로만 표시 */
  siteBase: string | null;
};

export function MerchantConsumerQrPanel({ tenantSlug, siteBase }: Props) {
  const t = encodeURIComponent(tenantSlug);
  const menuPath = `/t/${t}`;
  const menuUrl = siteBase ? `${siteBase}${menuPath}` : null;
  const tableExample = siteBase ? `${siteBase}/t/${t}?table=12` : `${menuPath}?table=12`;

  const [live, setLive] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string, okMsg: string) => {
      setLive(null);
      try {
        if (navigator.clipboard?.writeText) {
          await navigator.clipboard.writeText(text);
          setLive(okMsg);
          return;
        }
      } catch {
        /* fall through */
      }
      setLive("복사에 실패했습니다. 아래 주소를 길게 눌러 복사해 주세요.");
    },
    [],
  );

  return (
    <section
      className="mb-6 rounded-xl border border-chaya-border bg-chaya-surface p-4 dark:border-zinc-700 dark:bg-zinc-950"
      aria-labelledby="merchant-qr-heading"
    >
      <h2 id="merchant-qr-heading" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        손님 QR·메뉴 주소
      </h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        테이블 QR·포스터에 넣을 주소입니다. 메뉴 행의 <span className="font-mono text-xs">tenant_slug</span> 가{" "}
        <strong className="font-medium">{tenantSlug}</strong> 와 같아야 손님 화면에 메뉴가 보입니다.
      </p>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">기본 메뉴</dt>
          <dd className="mt-1">
            {menuUrl ? (
              <a
                href={menuUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all font-mono text-xs text-chaya-primary underline-offset-2 hover:underline dark:text-orange-400"
              >
                {menuUrl}
              </a>
            ) : (
              <span className="break-all font-mono text-xs">{menuPath}</span>
            )}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-700 dark:text-zinc-300">테이블 번호 예시 (선택)</dt>
          <dd className="mt-1 break-all font-mono text-xs text-zinc-600 dark:text-zinc-400">{tableExample}</dd>
        </div>
      </dl>

      {!siteBase ? (
        <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">
          전체 URL 복사·QR 생성 도구에는 Vercel에{" "}
          <span className="font-mono">NEXT_PUBLIC_SITE_URL</span> 을 설정한 뒤 재배포하세요.
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {menuUrl ? (
          <button
            type="button"
            onClick={() => void copy(menuUrl, "메뉴 주소를 복사했습니다.")}
            className="min-h-[44px] rounded-lg border border-chaya-border px-3 py-2 text-sm font-semibold text-chaya-primary dark:border-zinc-600"
          >
            메뉴 URL 복사
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => void copy(tableExample, "테이블 예시 주소를 복사했습니다.")}
          className="min-h-[44px] rounded-lg border border-chaya-border px-3 py-2 text-sm font-semibold text-chaya-primary dark:border-zinc-600"
        >
          테이블 예시 복사
        </button>
        <Link
          href={menuPath}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-[44px] items-center rounded-lg bg-chaya-primary px-3 py-2 text-sm font-semibold text-chaya-on-primary"
        >
          손님 화면 미리보기
        </Link>
      </div>

      {live ? (
        <p role="status" aria-live="polite" className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          {live}
        </p>
      ) : null}

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
        상세 절차: <span className="font-mono">docs/CONSUMER_TENANT_QR_SETUP.md</span>
      </p>
    </section>
  );
}

