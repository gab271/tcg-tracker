import { serverEnv } from "@/lib/config";

const BASE_URL = "https://api.pokemontcg.io/v2";
const FETCH_TIMEOUT_MS = 15_000;

function getHeaders(): Record<string, string> {
  const key = serverEnv.POKEMONTCG_API_KEY;
  return key ? { "X-Api-Key": key } : {};
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PokemonCardSummary {
  id: string;
  name: string;
  imageUrl: string;
  supertype: string;
  subtypes: string[];
  rarity: string;
  setName: string;
  hp: string | null;
  price: number | null;
}

export interface PokemonCardDetail extends PokemonCardSummary {
  types: string[];
  setId: string;
  number: string;
  artist: string | null;
  nationalPokedexNumbers: number[];
  largeImageUrl: string | null;
  /** Raw CardMarket price map (averageSellPrice, trendPrice, avg1…) */
  cardmarketPrices: Record<string, unknown> | null;
  /** Raw TCGPlayer price map keyed by variant (holofoil, normal…) */
  tcgplayerPrices: Record<string, Record<string, unknown>> | null;
}

export interface PokemonSearchResult {
  cards: PokemonCardSummary[];
  page: number;
  pageSize: number;
  total: number;
}

// ─── Raw API shapes (internal) ────────────────────────────────────────────────

interface RawPokemonCard {
  id: string;
  name: string;
  supertype: string;
  subtypes?: string[];
  hp?: string;
  types?: string[];
  rarity?: string;
  number?: string;
  artist?: string;
  nationalPokedexNumbers?: number[];
  set: { id: string; name: string };
  images: { small: string; large?: string };
  cardmarket?: { prices?: Record<string, unknown> };
  tcgplayer?: { prices?: Record<string, Record<string, unknown>> };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickPrice(map: Record<string, unknown> | null | undefined, ...keys: string[]): number | null {
  if (!map) return null;
  for (const key of keys) {
    const val = map[key];
    if (val !== null && val !== undefined && val !== 0) {
      const n = typeof val === "string" ? parseFloat(val) : (val as number);
      if (!isNaN(n) && n > 0) return n;
    }
  }
  return null;
}

async function fetchWithTimeout(url: string, options: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      // Timeout frecuente cuando se agota el límite de la API sin clave (1000 req/día).
      // Solución: añadir POKEMONTCG_API_KEY en .env.local
      throw new Error(
        "PokemonTCG API no respondió. Verifica que POKEMONTCG_API_KEY esté configurada en .env.local (límite gratuito: 1000 req/día)."
      );
    }
    throw new Error(`PokemonTCG API unreachable: ${err instanceof Error ? err.message : err}`);
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapSummary(card: RawPokemonCard): PokemonCardSummary {
  const cm = card.cardmarket?.prices;
  const tcg = card.tcgplayer?.prices;

  let price: number | null = pickPrice(cm, "averageSellPrice", "trendPrice", "avg1", "avg7");
  if (price === null && tcg) {
    const variant = tcg.holofoil ?? tcg.normal ?? tcg.reverseHolofoil ?? Object.values(tcg)[0];
    price = pickPrice(variant as Record<string, unknown>, "market", "mid", "low");
  }

  return {
    id: card.id,
    name: card.name,
    imageUrl: card.images?.small ?? "",
    supertype: card.supertype,
    subtypes: card.subtypes ?? [],
    rarity: card.rarity ?? "Unknown",
    setName: card.set?.name ?? "",
    hp: card.hp ?? null,
    price,
  };
}

function mapDetail(card: RawPokemonCard): PokemonCardDetail {
  return {
    ...mapSummary(card),
    types: card.types ?? [],
    setId: card.set?.id ?? "",
    number: card.number ?? "",
    artist: card.artist ?? null,
    nationalPokedexNumbers: card.nationalPokedexNumbers ?? [],
    largeImageUrl: card.images?.large ?? null,
    cardmarketPrices: card.cardmarket?.prices ?? null,
    tcgplayerPrices: card.tcgplayer?.prices ?? null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search Pokémon TCG cards by name.
 * Uses pokemontcg.io /v2/cards with wildcard suffix.
 */
export async function searchPokemonCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<PokemonSearchResult> {
  // Build URL manually — URLSearchParams encodes ':' as '%3A' which
  // breaks PokemonTCG.io's query syntax (expects a literal colon).
  const url =
    `${BASE_URL}/cards?q=name:${encodeURIComponent(query)}*` +
    `&page=${page}&pageSize=${pageSize}`;

  const res = await fetchWithTimeout(url, {
    headers: getHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`PokemonTCG API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as {
    data: RawPokemonCard[];
    page: number;
    pageSize: number;
    totalCount: number;
  };

  return {
    cards: (data.data ?? []).map(mapSummary),
    page: data.page,
    pageSize: data.pageSize,
    total: data.totalCount,
  };
}

/**
 * Fetch a single Pokémon card with full detail (including prices).
 * Returns null when the card is not found.
 */
export async function getPokemonCardById(
  id: string
): Promise<PokemonCardDetail | null> {
  const res = await fetchWithTimeout(`${BASE_URL}/cards/${encodeURIComponent(id)}`, {
    headers: getHeaders(),
    cache: "no-store",
  }).catch(() => null);

  if (!res) return null;
  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`PokemonTCG API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { data: RawPokemonCard };
  return mapDetail(data.data);
}
