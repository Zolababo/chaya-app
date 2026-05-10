import Link from "next/link";

export default function MerchantForbiddenPage() {
  return (
    <div className="mx-auto max-w-md p-8 text-center" role="alert" aria-live="assertive">
      <h1 className="text-xl font-bold">접근 거부</h1>
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        이 계정으로는 점주 화면에 연결된 가게가 없습니다. Supabase 대시보드에서{" "}
        <code className="rounded bg-zinc-200 px-1 font-mono text-xs dark:bg-zinc-800">merchant_tenant_members</code>
        에 멤버십 행을 추가했는지 확인하거나 운영 측에 문의해 주세요.
      </p>
      <p className="mt-6 flex flex-col items-center gap-4">
        <Link
          href="/m/login"
          className="inline-flex min-h-[48px] items-center justify-center font-semibold text-chaya-primary underline-offset-4 hover:underline dark:text-orange-400"
        >
          로그인 화면
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center justify-center text-sm font-medium text-zinc-500 underline-offset-4 hover:underline dark:text-zinc-400"
          aria-label="앱 처음으로"
        >
          처음으로
        </Link>
      </p>
    </div>
  );
}
