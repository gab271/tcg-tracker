import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import { getCardPrice } from "@/lib/tcg/prices";
import { redisGet, redisSet, REDIS_TTL } from "@/lib/redis";

// --- Normalize game parameter to canonical keys ---
function normalizeGame(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (s === "pokemon" || s === "pokémon" || s === "pkm") return "pokemon";
  if (s === "magic" || s === "magic: the gathering" || s === "mtg") return "magic";
  if (s === "yugioh" || s === "yu-gi-oh!" || s === "yu-gi-oh" || s === "ygo") return "yugioh";
  if (s === "onepiece" || s === "one piece" || s === "op" || s === "one piece tcg") return "onepiece";
  return s;
}

const VALID_GAMES = ["pokemon", "magic", "yugioh", "onepiece"] as const;
const VALID_CURRENCIES = ["EUR", "USD"] as const;
type Currency = (typeof VALID_CURRENCIES)[number];

// GET /api/card-price?cardId=xxx&game=pokemon|magic|yugioh|onepiece&currency=EUR|USD
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("cardId");
  const rawGame = searchParams.get("game");
  const rawCurrency = (searchParams.get("currency") ?? "EUR").toUpperCase() as Currency;
  const currency: Currency = VALID_CURRENCIES.includes(rawCurrency) ? rawCurrency : "EUR";

  if (!cardId || !rawGame) {
    return NextResponse.json(
      { error: "Missing required query params: cardId, game" },
      { status: 400 }
    );
  }

  const game = normalizeGame(rawGame);

  if (!VALID_GAMES.includes(game as typeof VALID_GAMES[number])) {
    return NextResponse.json(
      { error: 'Unsupported game. Use "pokemon", "magic", "yugioh", or "onepiece".' },
      { status: 400 }
    );
  }

  // Layer 1: Redis (1h) — fastest path, zero DB/API calls
  const redisCacheKey = `price:${game}:${cardId}:${currency}`;
  const redisCached = await redisGet<Record<string, unknown>>(redisCacheKey);
  if (redisCached) {
    return NextResponse.json({ ...redisCached, cached: true }, { headers: { "X-Cache": "HIT" } });
  }

  // Layer 2: Supabase cache (1h)
  const supabase = createAdminClient();
  try {
    const { data: cached } = await supabase
      .from("price_cache")
      .select("price, current_price, price_history, currency, source, card_name, image_url, cached_at")
      .eq("card_id", cardId)
      .eq("game", game)
      .eq("currency", currency)
      .maybeSingle();

    if (cached?.cached_at) {
      const age = Date.now() - new Date(cached.cached_at as string).getTime();
      if (age < 60 * 60 * 1000) {
        const payload = {
          currentPrice: ((cached.price ?? cached.current_price) as number | null),
          priceHistory: (cached.price_history as { date: string; price: number }[] | null) ?? [],
          currency: (cached.currency as string | null) ?? currency,
          source: cached.source as string | null,
          name: cached.card_name as string | null,
          image: cached.image_url as string | null,
          cached: true,
          cachedAt: cached.cached_at as string,
        };
        await redisSet(redisCacheKey, payload, { ex: REDIS_TTL.PRICE });
        return NextResponse.json(payload);
      }
    }
  } catch (err) {
    logger.warn(
      "[card-price] Supabase cache read failed:",
      err instanceof Error ? err.message : err
    );
  }

  // Layer 3: Live fetch via unified prices.ts adapter
  // prices.ts handles all external API calls, timeouts, and writes back to Supabase cache.
  const priceInfo = await getCardPrice(
    game as "pokemon" | "magic" | "yugioh" | "onepiece",
    cardId,
    currency
  );

  if (!priceInfo && game !== "onepiece") {
    return NextResponse.json(
      { error: `Card "${cardId}" not found for game "${game}"` },
      { status: 404 }
    );
  }

  const payload = {
    currentPrice: priceInfo?.price ?? null,
    priceHistory: [] as { date: string; price: number }[],
    currency: priceInfo?.currency ?? currency,
    source: priceInfo?.source ?? "unavailable",
    // name/image are populated from Supabase cache on subsequent requests
    // (writeCache in prices.ts persists card_name and image_url)
    name: null as string | null,
    image: null as string | null,
  };

  await redisSet(redisCacheKey, payload, { ex: REDIS_TTL.PRICE });

  return NextResponse.json({ ...payload, cached: false }, { headers: { "X-Cache": "MISS" } });
}
