import Link from "next/link";
import { Download, FileSpreadsheet } from "lucide-react";

import { MerchantMoreFlash } from "@/components/merchant-more-flash";
import { MerchantMoreSubPageBack } from "@/components/merchant-more-sub-page-back";
import { MerchantMoreSubPageShell } from "@/components/merchant-more-sub-page-shell";
import { requireMerchantForTenant } from "@/lib/merchant/merchant-access";
import { canExportMerchantSales } from "@/lib/merchant/merchant-role-capabilities";
import {
  merchantSaveBtnClass,
  merchantSecondaryBtnClass,
  merchantSubCardBodyClass,
  merchantSubCardClass,
} from "@/lib/merchant/merchant-more-sub-styles";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ tenant: string }>;
};

export default async function MerchantMoreExportPage({ params }: Props) {
  const { tenant } = await params;
  const { role } = await requireMerchantForTenant(tenant);
  const tEnc = encodeURIComponent(tenant);
  const moreHref = `/m/${tEnc}/more`;

  if (!canExportMerchantSales(role)) {
    return (
      <MerchantMoreSubPageShell>
        <MerchantMoreSubPageBack href={moreHref} label="매출 보내기" />
        <MerchantMoreFlash kind="warn">매출보내기는 소장·정산 계정만 사용할 수 있습니다.</MerchantMoreFlash>
      </MerchantMoreSubPageShell>
    );
  }

  const salesCsvHref = `/m/${tEnc}/more/export/sales`;
  const salesXlsxHref = `/m/${tEnc}/more/export/sales/xlsx`;

  return (
    <MerchantMoreSubPageShell>
      <MerchantMoreSubPageBack href={moreHref} label="매출 보내기" />

      <section className={merchantSubCardClass}>
        <div className={`${merchantSubCardBodyClass} grid gap-2 sm:grid-cols-2`}>
          <Link href={salesXlsxHref} className={`${merchantSaveBtnClass} gap-2`}>
            <FileSpreadsheet className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            Excel
          </Link>
          <Link href={salesCsvHref} className={`${merchantSecondaryBtnClass} gap-2`}>
            <Download className="h-4 w-4 shrink-0" strokeWidth={2.25} aria-hidden />
            CSV
          </Link>
        </div>
      </section>
    </MerchantMoreSubPageShell>
  );
}
