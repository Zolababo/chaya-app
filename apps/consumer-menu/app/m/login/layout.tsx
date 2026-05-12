import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/m/login/homescreen-manifest",
};

export default function MerchantLoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
