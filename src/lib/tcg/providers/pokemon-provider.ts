/**
 * Provider de PokémonTCG.io — implementa TCGProvider.
 *
 * - searchCards / getCardById: delegan en los adaptadores existentes (sin cambios).
 * - getAllCards: paginación sobre /v2/cards (250/página) para ingest masivo.
 * - getCardPrices: batch fetch individual porque PokémonTCG.io no tiene endpoint batch.
 *   Máx 10 concurrentes para no agotar el límite diario.
 * - getSets: /v2/sets ordenados por fecha descendente.
 */

import { serverEnv } from "@/lib/config";
import { searchPokemonCards, getPokemonCardById } from "@/lib/tcg/pokemon";
import type {
  TCGProvider,
  GameKey,
  ProviderSearchOptions,
  ProviderSearchResult,
  ProviderCardResult,
  ProviderCardDetail,
  ProviderPriceResult,
  ProviderSetResult,
  BulkIngestOptions,
  BulkIngestPage,
} from "@/lib/tcg/types";

const BASE_URL = "https://api.pokemontcg.io/v2";
const BULK_PAGE_SIZE = 250;       // máximo permitido por PokémonTCG.io
const FETCH_TIMEOUT_MS = 20_000;

function getHeaders(): Record<string, string> {
  const key = serverEnv.POKEMONTCG_API_KEY;
  return key ? { "X-Api-Key": key } : {};
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: getHeaders(),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("PokémonTCG.io timed out during bulk ingest");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function pickPokemonPrice(
  cm: Record<string, unknown> | null | undefined,
  tcg: Record<string, Record<string, unknown>> | null | undefined,
  currency: "EUR" | "USD"
): number | null {
  if (currency === "EUR" && cm) {
    for (const key of ["averageSellPrice", "trendPrice", "avg1", "avg7"]) {
      const v = cm[key];
      if (v && typeof v === "number" && v > 0) return v;
    }
  }
  if (tcg) {
    const variant = tcg.holofoil ?? tcg.normal ?? tcg.reverseHolofoil ?? Object.values(tcg)[0];
    if (variant) {
      for (const key of ["market", "mid", "low"]) {
        const v = (variant as Record<string, unknown>)[key];
        if (v && typeof v === "number" && v > 0) return v;
      }
    }
  }
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rawToProviderCard(card: Record<string, any>): ProviderCardResult {
  return {
    externalId: card.id as string,
    name: card.name as string,
    imageSmall: card.images?.small ?? "",
    imageLarge: card.images?.large ?? null,
    rarity: card.rarity ?? "Unknown",
    typeLine: [card.supertype, ...(card.subtypes ?? [])].filter(Boolean).join(" — "),
    setExternalId: card.set?.id ?? null,
    setName: card.set?.name ?? null,
    number: card.number ?? null,
    artist: card.artist ?? null,
    raw: card as Record<string, unknown>,
  };
}

// ─── PokemonProvider ──────────────────────────────────────────────────────────

export class PokemonProvider implements TCGProvider {
  readonly game: GameKey = "pokemon";
  readonly providerName = "pokemontcg";

  // Delega en el adaptador existente (sin modificar pokemon.ts)
  async searchCards(options: ProviderSearchOptions): Promise<ProviderSearchResult> {
    const { query, page = 1, pageSize = 20 } = options;
    const result = await searchPokemonCards(query, page, pageSize);
    return {
      cards: result.cards.map((c) => ({
        externalId: c.id,
        name: c.name,
        imageSmall: c.imageUrl,
        imageLarge: null,
        rarity: c.rarity,
        typeLine: [c.supertype, ...c.subtypes].filter(Boolean).join(" — "),
        setExternalId: null,
        setName: c.setName,
        number: null,
        artist: null,
        raw: {},
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.page * result.pageSize < result.total,
    };
  }

  // Delega en el adaptador existente y enriquece con precios
  async getCardById(externalId: string): Promise<ProviderCardDetail | null> {
    const card = await getPokemonCardById(externalId);
    if (!card) return null;

    const cmPrices = card.cardmarketPrices as Record<string, unknown> | null;
    const tcgPrices = card.tcgplayerPrices as Record<string, Record<string, unknown>> | null;

    const priceEUR = pickPokemonPrice(cmPrices, tcgPrices, "EUR");
    const priceUSD = pickPokemonPrice(cmPrices, tcgPrices, "USD");

    return {
      externalId: card.id,
      name: card.name,
      imageSmall: card.imageUrl,
      imageLarge: card.largeImageUrl,
      rarity: card.rarity,
      typeLine: [card.supertype, ...card.subtypes].filter(Boolean).join(" — "),
      setExternalId: card.setId,
      setName: card.setName,
      number: card.number,
      artist: card.artist,
      raw: { ...card },
      prices: [
        {
          externalId,
          game: "pokemon",
          currency: "EUR",
          price: priceEUR,
          priceFoil: null,
          source: "pokemontcg.io/cardmarket",
        },
        {
          externalId,
          game: "pokemon",
          currency: "USD",
          price: priceUSD,
          priceFoil: null,
          source: "pokemontcg.io/tcgplayer",
        },
      ],
    };
  }

  /**
   * Ingest masivo paginado.
   * cursor = número de página como string (empieza en "1").
   * La última página tiene nextCursor = null.
   */
  async getAllCards(options: BulkIngestOptions = {}): Promise<BulkIngestPage> {
    const page = parseInt(options.cursor ?? "1", 10);
    const url =
      `${BASE_URL}/cards?page=${page}&pageSize=${BULK_PAGE_SIZE}&orderBy=id`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      throw new Error(`PokémonTCG.io bulk error: ${res.status}`);
    }

    const json = (await res.json()) as {
      data: Record<string, unknown>[];
      page: number;
      pageSize: number;
      totalCount: number;
    };

    const cards = (json.data ?? []).map(rawToProviderCard);
    const fetched = page * BULK_PAGE_SIZE;
    const nextCursor = fetched < json.totalCount ? String(page + 1) : null;

    return {
      cards,
      nextCursor,
      totalEstimate: json.totalCount,
    };
  }

  /**
   * Precios en batch — PokémonTCG.io no tiene endpoint batch,
   * así que hacemos requests individuales con concurrencia limitada.
   */
  async getCardPrices(externalIds: string[]): Promise<ProviderPriceResult[]> {
    const results: ProviderPriceResult[] = [];
    const CONCURRENCY = 10;

    for (let i = 0; i < externalIds.length; i += CONCURRENCY) {
      const chunk = externalIds.slice(i, i + CONCURRENCY);
      const responses = await Promise.allSettled(
        chunk.map((id) => this.getCardById(id))
      );
      for (const r of responses) {
        if (r.status === "fulfilled" && r.value) {
          results.push(...r.value.prices);
        }
      }
    }

    return results;
  }

  /** Todos los sets de PokémonTCG.io */
  async getSets(): Promise<ProviderSetResult[]> {
    const res = await fetchWithTimeout(`${BASE_URL}/sets?orderBy=-releaseDate`);
    if (!res.ok) return [];

    const json = (await res.json()) as {
      data: Array<{
        id: string;
        name: string;
        series: string;
        printedTotal: number;
        total: number;
        releaseDate: string;
        images: { symbol: string; logo: string };
      }>;
    };

    return (json.data ?? []).map((s) => ({
      externalId: s.id,
      name: s.name,
      series: s.series ?? null,
      printedTotal: s.printedTotal ?? null,
      total: s.total ?? null,
      releaseDate: s.releaseDate ?? null,
      symbolUrl: s.images?.symbol ?? null,
      logoUrl: s.images?.logo ?? null,
      raw: s as Record<string, unknown>,
    }));
  }
}
