import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantMoreAboutPage({ params }: Props) {
  const { tenant } = await params;
  redirect(`/m/${encodeURIComponent(tenant)}/more/support`);
}
