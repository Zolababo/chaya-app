import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center"
      role="alert"
      aria-live="assertive"
    >
      <h1 className="text-2xl font-bold">페이지를 찾을 수 없습니다</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        주소가 바뀌었거나 잘못 입력되었을 수 있습니다. QR에 적힌 링크를 다시 확인해 주세요.
      </p>
      <Link
        href="/t/demo"
        className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-chaya-primary px-6 py-3 font-semibold text-chaya-on-primary"
        aria-label="데모 가게 메뉴판으로 이동"
      >
        데모 메뉴판으로
      </Link>
    </div>
  );
}
