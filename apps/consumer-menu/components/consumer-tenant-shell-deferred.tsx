"use client";

import dynamic from "next/dynamic";

const GuestSessionInit = dynamic(
  () => import("@/components/guest-session-init").then((m) => m.GuestSessionInit),
  { ssr: false },
);

const GuestSessionCookieSync = dynamic(
  () => import("@/components/guest-session-cookie-sync").then((m) => m.GuestSessionCookieSync),
  { ssr: false },
);

/** guest_session — 메뉴 첫 paint 이후 청크 로드 */
export function ConsumerTenantShellDeferred() {
  return (
    <>
      <GuestSessionInit />
      <GuestSessionCookieSync />
    </>
  );
}
