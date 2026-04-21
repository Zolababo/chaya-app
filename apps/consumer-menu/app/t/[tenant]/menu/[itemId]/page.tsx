import Link from "next/link";

type Props = {
  params: Promise<{ tenant: string; itemId: string }>;
};

export default async function MenuItemPage({ params }: Props) {
  const { tenant, itemId } = await params;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link
          href={`/t/${tenant}`}
          className="rounded-full border-2 border-zinc-200 px-3 py-2 text-sm font-semibold dark:border-zinc-700"
        >
          ← 메뉴
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="aspect-square rounded-3xl bg-zinc-200 dark:bg-zinc-800" aria-hidden />
        <div>
          <h1 className="text-2xl font-bold">메뉴 상세 ({itemId})</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            옵션·수량·담기 UI는 다음 단계에서 스티치 컴포넌트로 채웁니다.
          </p>
          <div className="mt-6 rounded-2xl border-2 border-zinc-200 p-4 dark:border-zinc-700">
            <p className="text-sm font-medium">수량</p>
            <p className="mt-2 text-sm text-zinc-500">QuantityStepper 자리</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-28 left-0 right-0 z-30 flex justify-center px-4">
        <Link
          href={`/t/${tenant}/cart`}
          className="w-full max-w-md rounded-2xl bg-orange-800 px-6 py-4 text-center text-lg font-bold text-white dark:bg-orange-700"
        >
          장바구니에 담기
        </Link>
      </div>
    </div>
  );
}
