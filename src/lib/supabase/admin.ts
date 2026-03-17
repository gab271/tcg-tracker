import { createClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/config";
import { logger } from "@/lib/logger";

/** Server-only Supabase client with service role key for elevated operations. */
export function createAdminClient() {
  const serviceKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    logger.warn(
      "createAdminClient: SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key. " +
      "Admin operations (price cache writes, user lookups) will be restricted by RLS."
    );
  }
  const key = serviceKey || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key);
}
