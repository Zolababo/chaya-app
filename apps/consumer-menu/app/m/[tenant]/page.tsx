import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

/** `/m/{tenant}` → 주문 큐 */
export default async function MerchantTenantRootPage({ params }: Props) {
  const { tenant } = await params;
  redirect(`/m/${encodeURIComponent(tenant)}/orders`);
}
