/**
 * GET /api/cards?game=pokemon|magic&q=pikachu&page=1&pageSize=20
 *
 * Frontend integration hint:
 *   - AddCardModal / collection page: call this endpoint when the user types
 *     in the card-search input.  Example:
 *       fetch(`/api/cards?game=${game}&q=${query}&page=${page}`)
 *   - useCardSearch hook can be updated to call this instead of hitting
 *     pokemontcg.io directly, so all games are supported uniformly.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchPokemonCards, type PokemonSearchResult } from "@/lib/tcg/pokemon";
import { searchMagicCards, isScryfallError, type MagicSearchResult } from "@/lib/tcg/magic";
import { redisGet, redisSet, REDIS_TTL } from "@/lib/redis";

const VALID_GAMES = ["pokemon", "magic"] as const;
type Game = (typeof VALID_GAMES)[number];
type SearchResult = PokemonSearchResult | MagicSearchResult;

export async function GET(request: NextRequest) {
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
      { error: 'Missing or invalid "game" param. Use "pokemon" or "magic".' },
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

  // 1. Redis cache (24 h) — fastest layer, avoids external API calls entirely
  const cached = await redisGet<SearchResult>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "X-Cache": "HIT" },
    });
  }

  try {
    let result: SearchResult;

    if (game === "pokemon") {
      result = await searchPokemonCards(query, page, pageSize);
    } else {
      const raw = await searchMagicCards(query, page, pageSize);
      if (isScryfallError(raw)) {
        const status = raw.status === 429 ? 429 : 502;
        return NextResponse.json({ error: raw.error }, { status });
      }
      result = raw;
    }

    // 2. Store in Redis for next requests
    await redisSet(cacheKey, result, { ex: REDIS_TTL.SEARCH });

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
