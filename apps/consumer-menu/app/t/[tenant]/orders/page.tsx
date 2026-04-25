type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function OrdersHubPage({ params }: Props) {
  const { tenant } = await params;

  return (
    <div className="mx-auto max-w-md space-y-4 text-center">
      <h1 className="text-2xl font-bold">주문 현황</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        주문을 완료하면 발급된 주소(주문 번호)로 진행 단계를 확인할 수 있습니다. 링크는 주문 직후 화면에
        표시됩니다.
      </p>
      <div className="flex flex-col gap-3 pt-4">
        <a
          href={`/t/${tenant}`}
          className="rounded-xl border border-chaya-border py-3 font-semibold text-chaya-primary dark:border-zinc-700"
        >
          메뉴로
        </a>
        <a
          href={`/t/${tenant}/cart`}
          className="rounded-xl bg-chaya-primary py-3 font-semibold text-chaya-on-primary"
        >
          장바구니
        </a>
      </div>
    </div>
  );
}
