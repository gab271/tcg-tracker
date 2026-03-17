/**
 * GET /api/card/[id]?game=pokemon|magic
 *
 * Returns full card metadata + current price in one call.
 *
 * Frontend integration hint:
 *   - Card detail page / collection/[cardId]/page.tsx: call this endpoint
 *     when mounting the page.  Example:
 *       fetch(`/api/card/${cardId}?game=${game}`)
 *   - The response shape is { card: CardDetail, price: PriceInfo | null }.
 *     Render card.largeImageUrl for the hero image and price.price for the
 *     current market value.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPokemonCardById, type PokemonCardDetail } from "@/lib/tcg/pokemon";
import { getMagicCardById, isScryfallError, type MagicCardDetail } from "@/lib/tcg/magic";
import { getCardPrice, type PriceInfo } from "@/lib/tcg/prices";
import { redisGet, redisSet, REDIS_TTL } from "@/lib/redis";

const VALID_GAMES = ["pokemon", "magic"] as const;
type Game = (typeof VALID_GAMES)[number];

interface CardDetailResponse {
  card: PokemonCardDetail | MagicCardDetail;
  price: PriceInfo | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const game = searchParams.get("game")?.toLowerCase() as Game | null;

  if (!id) {
    return NextResponse.json({ error: 'Missing route param "id".' }, { status: 400 });
  }

  if (!game || !VALID_GAMES.includes(game)) {
    return NextResponse.json(
      { error: 'Missing or invalid "game" param. Use "pokemon" or "magic".' },
      { status: 400 }
    );
  }

  const cacheKey = `card:${game}:${id}`;

  // 1. Redis cache (6 h) — card metadata is stable, price is refreshed separately
  const cached = await redisGet<CardDetailResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  try {
    let card: PokemonCardDetail | MagicCardDetail | null = null;
    let price: PriceInfo | null = null;

    if (game === "pokemon") {
      [card, price] = await Promise.all([
        getPokemonCardById(id),
        getCardPrice("pokemon", id, "EUR"),
      ]);
    } else {
      const [rawCard, rawPrice] = await Promise.all([
        getMagicCardById(id),
        getCardPrice("magic", id, "EUR"),
      ]);

      if (isScryfallError(rawCard)) {
        const status = rawCard.status === 429 ? 429 : 502;
        return NextResponse.json({ error: rawCard.error }, { status });
      }

      card = rawCard;
      price = rawPrice;
    }

    if (!card) {
      return NextResponse.json(
        { error: `Card "${id}" not found for game "${game}".` },
        { status: 404 }
      );
    }

    const payload: CardDetailResponse = { card, price };

    // 2. Store in Redis — use CARD TTL for metadata, price is separately cached in Supabase
    await redisSet(cacheKey, payload, { ex: REDIS_TTL.CARD });

    return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
