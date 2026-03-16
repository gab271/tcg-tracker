import { createClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/config";

/** Server-only Supabase client with service role key for elevated operations. */
export function createAdminClient() {
  const key = serverEnv.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, key);
}
