import { createClient } from "@supabase/supabase-js";
import { requirePublicSupabaseEnv, requireSupabaseServiceRoleKey } from "@/src/lib/env";

export function createAdminClient() {
  const { url } = requirePublicSupabaseEnv();
  return createClient(url, requireSupabaseServiceRoleKey(), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
