import { GuestOrdersHub } from "./guest-orders-hub";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function OrdersHubPage({ params }: Props) {
  const { tenant } = await params;

  return (
    <div className="mx-auto max-w-md space-y-6" aria-labelledby="orders-hub-heading">
      <div className="text-center">
        <h1 id="orders-hub-heading" className="text-2xl font-bold">
          주문 현황
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          이 브라우저에서 같은 가게로 보낸 주문만 보입니다. 주문 직후 받은 링크로도 언제든 상태를 확인할 수
          있습니다.
        </p>
      </div>

      <GuestOrdersHub tenant={tenant} />
    </div>
  );
}
