/**
 * GET /api/cards?game=pokemon|magic|yugioh|onepiece&q=QUERY&page=1&pageSize=20
 *
 * Unified card search endpoint. Routes to the appropriate external API
 * based on the `game` parameter:
 *   pokemon   → PokemonTCG.io
 *   magic     → Scryfall
 *   yugioh    → YGOPRODeck
 *   onepiece  → Bandai official card list
 */

import { NextRequest, NextResponse } from "next/server";
import { searchPokemonCards, type PokemonSearchResult } from "@/lib/tcg/pokemon";
import { searchMagicCards, isScryfallError, type MagicSearchResult } from "@/lib/tcg/magic";
import { searchYugiohCards, type YugiohSearchResult } from "@/lib/tcg/yugioh";
import { searchOnePieceCards, type OnePieceSearchResult } from "@/lib/tcg/onepiece";
import { redisGet, redisSet, REDIS_TTL } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";

const VALID_GAMES = ["pokemon", "magic", "yugioh", "onepiece"] as const;
type Game = (typeof VALID_GAMES)[number];
type SearchResult = PokemonSearchResult | MagicSearchResult | YugiohSearchResult | OnePieceSearchResult;

export async function GET(request: NextRequest) {
  const rl = await rateLimit(request, "cards");
  if (!rl.success) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": "0",
          "Retry-After": String(Math.ceil((rl.reset - Date.now()) / 1000)),
        },
      }
    );
  }

  const { searchParams } = new URL(request.url);

  const game = searchParams.get("game")?.toLowerCase() as Game | null;
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "20", 10) || 20)
  );

  if (!game || !VALID_GAMES.includes(game)) {
    return NextResponse.json(
      { error: 'Missing or invalid "game" param. Use "pokemon", "magic", "yugioh", or "onepiece".' },
      { status: 400 }
    );
  }

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { error: 'Missing required query param "q".' },
      { status: 400 }
    );
  }

  const query = q.trim().toLowerCase();
  const cacheKey = `cards:${game}:${query}:${page}:${pageSize}`;

  // 1. Redis cache — fastest layer
  const cached = await redisGet<SearchResult>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    let result: SearchResult;

    if (game === "pokemon") {
      result = await searchPokemonCards(query, page, pageSize);
    } else if (game === "magic") {
      const raw = await searchMagicCards(query, page, pageSize);
      if (isScryfallError(raw)) {
        const status = raw.status === 429 ? 429 : 502;
        return NextResponse.json({ error: raw.error }, { status });
      }
      result = raw;
    } else if (game === "yugioh") {
      result = await searchYugiohCards(query, page, pageSize);
    } else {
      // onepiece
      result = await searchOnePieceCards(query, page, pageSize);
    }

    // 2. Cache in Redis (shorter TTL for One Piece since HTML parsing is fragile)
    const ttl = game === "onepiece" ? REDIS_TTL.PRICE : REDIS_TTL.SEARCH;
    await redisSet(cacheKey, result, { ex: ttl });

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    // Use 503 for timeout/unreachable, 500 for other errors
    const status = message.includes("timed out") || message.includes("unreachable") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
