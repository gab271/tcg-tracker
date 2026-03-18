/**
 * GET /api/card/[id]?game=pokemon|magic|yugioh|onepiece
 *
 * Devuelve metadatos completos + precio actual de una carta. Flujo DB-first:
 *   1. Redis cache (7 días — catálogo es estable)
 *   2. tcg_cards table (DB local)
 *   3. Provider externo como fallback → guarda en DB
 *
 * La forma de respuesta es { card: CardDetail, price: PriceInfo | null }
 * — no cambia para el frontend.
 */

import { NextRequest, NextResponse } from "next/server";
import { getPokemonCardById, type PokemonCardDetail } from "@/lib/tcg/pokemon";
import { getMagicCardById, isScryfallError, type MagicCardDetail } from "@/lib/tcg/magic";
import { getCardPrice, type PriceInfo } from "@/lib/tcg/prices";
import { redisGet, redisSet, REDIS_TTL } from "@/lib/redis";
import {
  getCardFromDB,
  upsertCards,
  logCardAccess,
} from "@/lib/services/catalog.service";
import { getSinglePriceFromDB } from "@/lib/services/price.service";
import type { GameKey } from "@/lib/tcg/types";

const VALID_GAMES = ["pokemon", "magic", "yugioh", "onepiece"] as const;
type Game = (typeof VALID_GAMES)[number];

interface CardDetailResponse {
  card: PokemonCardDetail | MagicCardDetail | Record<string, unknown>;
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
      { error: 'Missing or invalid "game" param. Use "pokemon", "magic", "yugioh", or "onepiece".' },
      { status: 400 }
    );
  }

  const cacheKey = `card:${game}:${id}`;

  // 1. Redis cache
  const cached = await redisGet<CardDetailResponse>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // Registrar acceso (async, no bloquea)
  logCardAccess(id, game as GameKey).catch(() => {});

  // 2. DB-first: buscar en tcg_cards
  const dbCard = await getCardFromDB(id, game as GameKey);

  if (dbCard) {
    // Carta encontrada en DB local — obtener precio desde card_prices
    const dbPrice = await getSinglePriceFromDB(id, game as GameKey, "EUR");

    const card = dbCardToDetailShape(dbCard, game);
    const price: PriceInfo | null = dbPrice
      ? { price: dbPrice.price, currency: dbPrice.currency, source: dbPrice.source }
      : null;

    const payload: CardDetailResponse = { card, price };
    await redisSet(cacheKey, payload, { ex: REDIS_TTL.CARD });
    return NextResponse.json(payload, { headers: { "X-Cache": "DB" } });
  }

  // 3. Fallback al provider externo
  try {
    let card: PokemonCardDetail | MagicCardDetail | null = null;
    let price: PriceInfo | null = null;

    if (game === "pokemon") {
      [card, price] = await Promise.all([
        getPokemonCardById(id),
        getCardPrice("pokemon", id, "EUR"),
      ]);
    } else if (game === "magic") {
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
    } else {
      // yugioh / onepiece — solo precio via prices.ts
      price = await getCardPrice(game, id, "EUR");
    }

    if (!card && game !== "yugioh" && game !== "onepiece") {
      return NextResponse.json(
        { error: `Card "${id}" not found for game "${game}".` },
        { status: 404 }
      );
    }

    // Guardar en DB (fire-and-forget)
    if (card) {
      storeCardAsync(card, id, game as GameKey);
    }

    const payload: CardDetailResponse = {
      card: card ?? { id, game },
      price,
    };

    await redisSet(cacheKey, payload, { ex: REDIS_TTL.CARD });
    return NextResponse.json(payload, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convierte una ProviderCardResult de DB al shape que espera el frontend
 * (compatible con PokemonCardDetail / MagicCardDetail)
 */
function dbCardToDetailShape(
  dbCard: { externalId: string; name: string; imageSmall: string; imageLarge: string | null; rarity: string; typeLine: string; number: string | null; artist: string | null; raw: Record<string, unknown> },
  game: string
): Record<string, unknown> {
  // Devolver el raw_data si está disponible (contiene la forma completa original del provider)
  // Esto garantiza que el frontend recibe el mismo shape que antes
  if (dbCard.raw && Object.keys(dbCard.raw).length > 0) {
    return {
      ...dbCard.raw,
      // Asegurar campos básicos que siempre deben estar presentes
      id: dbCard.externalId,
      name: dbCard.name,
      imageUrl: dbCard.imageSmall,
      largeImageUrl: dbCard.imageLarge,
      game,
    };
  }

  // Fallback mínimo si raw_data está vacío
  return {
    id: dbCard.externalId,
    name: dbCard.name,
    imageUrl: dbCard.imageSmall,
    largeImageUrl: dbCard.imageLarge,
    rarity: dbCard.rarity,
    typeLine: dbCard.typeLine,
    number: dbCard.number,
    artist: dbCard.artist,
    game,
  };
}

/** Guarda la carta en tcg_cards de forma asíncrona (no bloquea la respuesta) */
function storeCardAsync(
  card: PokemonCardDetail | MagicCardDetail,
  externalId: string,
  game: GameKey
): void {
  const providerCard = {
    externalId,
    name: card.name,
    imageSmall: card.imageUrl ?? "",
    imageLarge: (card as PokemonCardDetail).largeImageUrl ?? (card as MagicCardDetail).largeImageUrl ?? null,
    rarity: card.rarity ?? "Unknown",
    typeLine: (card as MagicCardDetail).typeLine ?? "",
    setExternalId: (card as PokemonCardDetail).setId ?? null,
    setName: card.setName ?? null,
    number: (card as PokemonCardDetail).number ?? null,
    artist: (card as PokemonCardDetail).artist ?? null,
    raw: card as unknown as Record<string, unknown>,
  };

  upsertCards([providerCard], game).catch(() => {});
}
