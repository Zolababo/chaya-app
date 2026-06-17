import { MerchantLoadingCenter } from "@/components/merchant-loading-center";

/** 탭 전환 시 즉시 보이는 로더 — SSR 대기 체감 개선 */
export default function MerchantTenantLoading() {
  return <MerchantLoadingCenter />;
}
