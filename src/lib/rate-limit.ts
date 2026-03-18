/**
 * Rate limiting utility using Upstash Ratelimit + Redis.
 *
 * Design principles:
 * - Fail-open: always allows the request if Redis is unavailable or slow.
 * - 800ms hard timeout on the rate-limit check — never delays the primary request.
 * - Singletons for both Redis and Ratelimit instances (not recreated per request).
 *
 * Usage:
 *   const { success, limit, remaining, reset } = await rateLimit(request, "cards");
 *   if (!success) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

type Preset = "cards" | "price";

const RATE_LIMIT_TIMEOUT_MS = 800;

// Lazy-initialized singletons — created at most once per process lifetime
let _redis: Redis | null = null;
let _cardsLimiter: Ratelimit | null = null;
let _priceLimiter: Ratelimit | null = null;

function getRedis(): Redis | null {
  if (_redis) return _redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

function getLimiter(preset: Preset): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  if (preset === "cards") {
    if (!_cardsLimiter) {
      _cardsLimiter = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(30, "1 m"), // 30 req/min per IP
        prefix: "rl:cards",
        analytics: false,
      });
    }
    return _cardsLimiter;
  }

  if (!_priceLimiter) {
    _priceLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 req/min per IP
      prefix: "rl:price",
      analytics: false,
    });
  }
  return _priceLimiter;
}

/** Extract the best available IP identifier from the request. */
function getIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "anonymous";
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (ms) when the window resets
}

const ALLOW: RateLimitResult = { success: true, limit: 0, remaining: 0, reset: 0 };

export async function rateLimit(
  req: NextRequest,
  preset: Preset
): Promise<RateLimitResult> {
  // Hard timeout — if rate-limit check takes > 800ms, allow the request and move on
  const timeout = new Promise<RateLimitResult>((resolve) =>
    setTimeout(() => resolve(ALLOW), RATE_LIMIT_TIMEOUT_MS)
  );

  const check = (async (): Promise<RateLimitResult> => {
    try {
      const limiter = getLimiter(preset);
      if (!limiter) return ALLOW; // Redis not configured — skip rate limiting

      const identifier = getIdentifier(req);
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch {
      return ALLOW; // Never block traffic due to a Redis error
    }
  })();

  return Promise.race([check, timeout]);
}
