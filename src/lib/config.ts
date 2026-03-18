/** Centralized environment variable access. All env vars must be read from here. */

function required(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/** Client-safe env vars (NEXT_PUBLIC_*) */
export const env = {
  NEXT_PUBLIC_SUPABASE_URL: required(
    "NEXT_PUBLIC_SUPABASE_URL",
    process.env.NEXT_PUBLIC_SUPABASE_URL
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: required(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ),
} as const;

/** Server-only env vars. Accessing these on the client will throw.
 *  Critical secrets (service role, Redis, cron) throw at access time if missing.
 *  Optional integrations (Resend, Pokemon API key) fall back to "".
 */
export const serverEnv = {
  get SUPABASE_SERVICE_ROLE_KEY() {
    return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get POKEMONTCG_API_KEY() {
    return process.env.POKEMONTCG_API_KEY ?? "";
  },
  get UPSTASH_REDIS_REST_URL() {
    return process.env.UPSTASH_REDIS_REST_URL ?? "";
  },
  get UPSTASH_REDIS_REST_TOKEN() {
    return process.env.UPSTASH_REDIS_REST_TOKEN ?? "";
  },
  get CRON_SECRET() {
    return required("CRON_SECRET", process.env.CRON_SECRET);
  },
  get RESEND_API_KEY() {
    return process.env.RESEND_API_KEY ?? "";
  },
  get STRIPE_SECRET_KEY() {
    return required("STRIPE_SECRET_KEY", process.env.STRIPE_SECRET_KEY);
  },
  get STRIPE_WEBHOOK_SECRET() {
    return required("STRIPE_WEBHOOK_SECRET", process.env.STRIPE_WEBHOOK_SECRET);
  },
  get STRIPE_PRO_PRICE_ID() {
    return required("STRIPE_PRO_PRICE_ID", process.env.STRIPE_PRO_PRICE_ID);
  },
} as const;

/** Client-safe Stripe key */
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
