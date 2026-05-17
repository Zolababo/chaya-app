import { Suspense } from "react";

import { ConsumerSessionAccountLink } from "@/components/consumer-session-account-link";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { SessionHeader } from "@/components/session-header";
import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

type Props = {
  tenant: string;
};

export async function TenantSessionHeader({ tenant }: Props) {
  const supabase = await createSupabaseServerClient();
  const loggedIn = supabase ? !!(await resolveServerUser(supabase)) : false;

  return (
    <SessionHeader
      tenant={tenant}
      localeSlot={
        <Suspense fallback={null}>
          <LocaleSwitcher />
        </Suspense>
      }
      accountSlot={<ConsumerSessionAccountLink tenant={tenant} loggedIn={loggedIn} />}
    />
  );
}
