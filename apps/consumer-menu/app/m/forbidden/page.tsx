import Link from "next/link";

export default function MerchantForbiddenPage() {
  return (
    <div className="mx-auto max-w-md p-8 text-center" role="alert" aria-live="assertive">
      <h1 className="text-xl font-bold">접근 거부</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        주문 관리 화면은 유효한 <code className="rounded bg-zinc-200 px-1 font-mono text-xs dark:bg-zinc-800">token</code>{" "}
        이 필요합니다.
      </p>
      <p className="mt-6">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center font-semibold text-chaya-primary underline-offset-4 hover:underline dark:text-orange-400"
          aria-label="앱 처음으로"
        >
          처음으로
        </Link>
      </p>
    </div>
  );
}
