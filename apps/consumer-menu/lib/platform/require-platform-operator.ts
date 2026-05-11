import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/create-server-session-client";
import { resolveServerUser } from "@/lib/supabase/resolve-server-user";

import { opsLoginUrl } from "./ops-path";

export async function requirePlatformOperator(nextPathFallback = "/ops"): Promise<{ userId: string }> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(opsLoginUrl(nextPathFallback));
  }

  const user = await resolveServerUser(supabase);
  if (!user) {
    redirect(opsLoginUrl(nextPathFallback));
  }

  const { data: row, error } = await supabase
    .from("platform_operators")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !row) {
    redirect("/ops/forbidden");
  }

  return { userId: user.id };
}
