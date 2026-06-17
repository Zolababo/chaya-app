import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

/** 영업 설정은 더보기 허브 아코디언으로 통합 */
export default async function MerchantMoreHoursPage({ params }: Props) {
  const { tenant } = await params;
  redirect(`/m/${encodeURIComponent(tenant)}/more`);
}
