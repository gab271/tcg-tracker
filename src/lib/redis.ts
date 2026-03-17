/**
 * Upstash Redis helper for server-side caching.
 *
 * Falls back gracefully when UPSTASH_REDIS_REST_URL / TOKEN are not set,
 * so the app works in local dev without Redis configured.
 *
 * Usage:
 *   const cached = await redisGet<MyType>("my-key");
 *   await redisSet("my-key", value, { ex: 3600 }); // TTL in seconds
 *   await redisDel("my-key");
 */

import { Redis } from "@upstash/redis";
import { serverEnv } from "@/lib/config";

// Singleton — reuse the same connection across requests in the same process
let _redis: Redis | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;

  const url = serverEnv.UPSTASH_REDIS_REST_URL;
  const token = serverEnv.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) return null; // Redis not configured — use Supabase cache only

  _redis = new Redis({ url, token });
  return _redis;
}

/** Read a cached value. Returns null on miss or when Redis is unavailable. */
export async function redisGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedis();
    if (!client) return null;
    return await client.get<T>(key);
  } catch {
    return null;
  }
}

/**
 * Write a value to Redis.
 * @param ex  TTL in seconds (default: 86400 = 24 hours)
 */
export async function redisSet(
  key: string,
  value: unknown,
  options: { ex?: number } = {}
): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.set(key, value, { ex: options.ex ?? 86_400 });
  } catch {
    // Non-critical — never throw
  }
}

/** Delete a key (useful for manual cache busting). */
export async function redisDel(key: string): Promise<void> {
  try {
    const client = getRedis();
    if (!client) return;
    await client.del(key);
  } catch {
    // Non-critical
  }
}

// ─── TTLs ────────────────────────────────────────────────────────────────────
export const REDIS_TTL = {
  SEARCH: 60 * 60 * 24,   // 24 h  — search results change rarely
  CARD:   60 * 60 * 6,    // 6 h   — card metadata is stable
  PRICE:  60 * 60,        // 1 h   — prices refresh hourly
} as const;
