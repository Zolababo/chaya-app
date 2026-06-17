import { Suspense } from "react";

import { OpsConsoleFrame } from "@/components/ops/ops-console-frame";
import { OpsStoreListClient } from "@/components/ops/ops-store-list-client";
import { listPlatformStores } from "@/lib/platform/list-platform-stores";
import { requirePlatformOperator } from "@/lib/platform/require-platform-operator";

export const dynamic = "force-dynamic";

export default async function OpsStoresPage() {
  await requirePlatformOperator("/ops/stores");
  const result = await listPlatformStores();

  return (
    <OpsConsoleFrame bare>
      {!result.ok ? (
        <p role="alert" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          {result.message}
        </p>
      ) : (
        <Suspense fallback={<p className="text-sm text-ops-muted">매장 목록 불러오는 중…</p>}>
          <OpsStoreListClient stores={result.stores} />
        </Suspense>
      )}
    </OpsConsoleFrame>
  );
}
