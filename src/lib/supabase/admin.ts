import { createClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/config";
import { logger } from "@/lib/logger";

/** Server-only Supabase client with service role key for elevated operations. */
export function createAdminClient() {
  const serviceKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is required for admin operations. " +
      "Add it to your environment variables."
    );
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, serviceKey);
}
