/**
 * GET /api/cards?game=pokemon|magic|yugioh|onepiece&q=QUERY&page=1&pageSize=20
 *
 * Búsqueda de cartas unificada. Flujo DB-first:
 *   1. Redis cache (24h)
 *   2. tcg_cards table — búsqueda fulltext local
 *   3. Provider externo — fallback on-demand si la DB devuelve vacío
 *      → guarda los resultados en tcg_cards para la próxima búsqueda
 *
 * El frontend nunca sabe si los datos vienen de la DB o del provider.
 */

import { NextRequest, NextResponse } from "next/server";
import { searchPokemonCards, type PokemonSearchResult } from "@/lib/tcg/pokemon";
import { searchMagicCards, isScryfallError, type MagicSearchResult } from "@/lib/tcg/magic";
import { searchYugiohCards, type YugiohSearchResult } from "@/lib/tcg/yugioh";
import { searchOnePieceCards, type OnePieceSearchResult } from "@/lib/tcg/onepiece";
import { redisGet, redisSet, REDIS_TTL } from "@/lib/redis";
import { rateLimit } from "@/lib/rate-limit";
import {
  searchFromDB,
  upsertCards,
  logCardAccessBatch,
} from "@/lib/services/catalog.service";
import type { GameKey } from "@/lib/tcg/types";

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

  // 1. Redis cache — capa más rápida
  const cached = await redisGet<SearchResult>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // 2. DB-first: buscar en tcg_cards
  try {
    const dbResult = await searchFromDB(query, game as GameKey, page, pageSize);

    if (dbResult.total > 0) {
      // Resultado encontrado en la DB local — registrar acceso para refresh de precios
      const ids = dbResult.cards.map((c) => c.externalId);
      await logCardAccessBatch(ids, game as GameKey);

      // Normalizar al formato que espera el frontend (compatible con los adapters existentes)
      const result = normalizeDBResult(dbResult, game, page, pageSize);
      await redisSet(cacheKey, result, { ex: REDIS_TTL.SEARCH });
      return NextResponse.json(result, { headers: { "X-Cache": "DB" } });
    }
  } catch {
    // DB-first falló — continuar con fallback al provider (degradación elegante)
  }

  // 3. Fallback: provider externo
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
      result = await searchOnePieceCards(query, page, pageSize);
    }

    // Guardar resultados en DB para futuras búsquedas (enriquecimiento orgánico del catálogo)
    storeProviderResultsAsync(result, game as GameKey);

    const ttl = game === "onepiece" ? REDIS_TTL.PRICE : REDIS_TTL.SEARCH;
    await redisSet(cacheKey, result, { ex: ttl });

    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    const status = message.includes("timed out") || message.includes("unreachable") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normaliza resultados de tcg_cards al formato que espera el frontend.
 * Mantiene compatibilidad con la forma {cards, page, pageSize, total}.
 */
function normalizeDBResult(
  dbResult: { cards: { externalId: string; name: string; imageSmall: string; rarity: string; typeLine: string }[]; total: number },
  game: string,
  page: number,
  pageSize: number
) {
  return {
    cards: dbResult.cards.map((c) => ({
      id: c.externalId,
      name: c.name,
      imageUrl: c.imageSmall,
      rarity: c.rarity,
      typeLine: c.typeLine,
      game,
      price: null, // Los precios se cargan por separado en /api/card-price
    })),
    page,
    pageSize,
    total: dbResult.total,
  };
}

/**
 * Guarda los resultados del provider en tcg_cards de forma asíncrona (fire-and-forget).
 * No bloquea la respuesta al usuario.
 */
function storeProviderResultsAsync(result: SearchResult, game: GameKey): void {
  const cards = (result as { cards: Array<{ id?: string; name: string; imageUrl?: string; rarity?: string; typeLine?: string }> }).cards ?? [];
  if (cards.length === 0) return;

  const providerCards = cards.map((c) => ({
    externalId: c.id ?? "",
    name: c.name,
    imageSmall: c.imageUrl ?? "",
    imageLarge: null,
    rarity: c.rarity ?? "Unknown",
    typeLine: c.typeLine ?? "",
    setExternalId: null,
    setName: null,
    number: null,
    artist: null,
    raw: c as Record<string, unknown>,
  })).filter((c) => c.externalId);

  // Fire-and-forget: no await — no bloquea la respuesta
  upsertCards(providerCards, game).catch(() => {
    // No crítico — el catálogo se llenará en el siguiente sync
  });

  // Registrar accesos
  logCardAccessBatch(providerCards.map((c) => c.externalId), game).catch(() => {});
}
