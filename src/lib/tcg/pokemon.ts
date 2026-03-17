import { serverEnv } from "@/lib/config";

const BASE_URL = "https://api.pokemontcg.io/v2";

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

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapSummary(card: RawPokemonCard): PokemonCardSummary {
  return {
    id: card.id,
    name: card.name,
    imageUrl: card.images.small,
    supertype: card.supertype,
    subtypes: card.subtypes ?? [],
    rarity: card.rarity ?? "Unknown",
    setName: card.set.name,
    hp: card.hp ?? null,
  };
}

function mapDetail(card: RawPokemonCard): PokemonCardDetail {
  return {
    ...mapSummary(card),
    types: card.types ?? [],
    setId: card.set.id,
    number: card.number ?? "",
    artist: card.artist ?? null,
    nationalPokedexNumbers: card.nationalPokedexNumbers ?? [],
    largeImageUrl: card.images.large ?? null,
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
  // Build URL manually — URLSearchParams would encode ':' as '%3A' which
  // breaks PokemonTCG.io's query syntax (it expects a literal colon).
  const url =
    `${BASE_URL}/cards?q=name:${encodeURIComponent(query)}*` +
    `&page=${page}&pageSize=${pageSize}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(url, {
      headers: getHeaders(),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    const msg = err instanceof Error && err.name === "AbortError"
      ? "PokemonTCG API timed out"
      : `PokemonTCG API unreachable: ${err instanceof Error ? err.message : err}`;
    throw new Error(msg);
  }
  clearTimeout(timeout);

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
    cards: data.data.map(mapSummary),
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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/cards/${encodeURIComponent(id)}`, {
      headers: getHeaders(),
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") return null;
    throw new Error(`PokemonTCG API unreachable: ${err instanceof Error ? err.message : err}`);
  }
  clearTimeout(timeout);

  if (res.status === 404) return null;

  if (!res.ok) {
    throw new Error(`PokemonTCG API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { data: RawPokemonCard };
  return mapDetail(data.data);
}
