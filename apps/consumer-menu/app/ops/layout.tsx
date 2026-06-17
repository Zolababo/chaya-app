import type { ReactNode } from "react";
import Script from "next/script";

import { OpsAppShell } from "@/components/ops/ops-app-shell";
import { getPlatformNavBadges } from "@/lib/platform/get-platform-nav-badges";
import { opsViewBootScript } from "@/lib/responsive/ops-view-boot-script";

export default async function OpsRootLayout({ children }: { children: ReactNode }) {
  const badges = await getPlatformNavBadges();

  return (
    <div data-chaya-ops>
      <Script
        id="chaya-ops-view-boot"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{ __html: opsViewBootScript }}
      />
      <OpsAppShell badges={badges}>{children}</OpsAppShell>
    </div>
  );
}
