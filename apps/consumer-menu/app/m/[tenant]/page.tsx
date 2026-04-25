import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ token?: string }>;
};

/** `/m/{tenant}?token=` → 주문 큐로 보냅니다. */
export default async function MerchantTenantRootPage({ params, searchParams }: Props) {
  const { tenant } = await params;
  const { token } = await searchParams;
  const qs = new URLSearchParams();
  if (token) qs.set("token", token);
  const suffix = qs.toString() ? `?${qs.toString()}` : "";
  redirect(`/m/${encodeURIComponent(tenant)}/orders${suffix}`);
}
