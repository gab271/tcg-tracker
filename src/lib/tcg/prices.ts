/**
 * Unified price-fetching layer with Supabase caching.
 *
 * SQL MIGRATION — paste into Supabase SQL Editor
 * ================================================
 *
 * Option A  New setup (no existing price_cache table):
 *
 *   CREATE TABLE IF NOT EXISTS price_cache (
 *     id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
 *     card_id       TEXT          NOT NULL,
 *     game          TEXT          NOT NULL,       -- 'pokemon' | 'magic' | 'yugioh' | 'onepiece'
 *     currency      TEXT          NOT NULL DEFAULT 'EUR',
 *     price         NUMERIC(10,2),
 *     source        TEXT,                          -- 'pokemontcg.io/cardmarket' | 'scryfall' | …
 *     updated_at    TIMESTAMPTZ   DEFAULT NOW(),
 *     -- legacy columns (required by /api/card-price, kept for compatibility):
 *     card_name     TEXT,
 *     price_history JSONB         DEFAULT '[]'::JSONB,
 *     image_url     TEXT,
 *     cached_at     TIMESTAMPTZ   DEFAULT NOW(),
 *     current_price NUMERIC(10,2)
 *   );
 *
 *   CREATE UNIQUE INDEX IF NOT EXISTS price_cache_card_game_currency_idx
 *     ON price_cache (card_id, game, currency);
 *
 * Option B  Table already exists — apply the migration:
 *
 *   ALTER TABLE price_cache ADD COLUMN IF NOT EXISTS currency     TEXT          DEFAULT 'EUR';
 *   ALTER TABLE price_cache ADD COLUMN IF NOT EXISTS price        NUMERIC(10,2);
 *   ALTER TABLE price_cache ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ   DEFAULT NOW();
 *
 *   -- Backfill
 *   UPDATE price_cache SET currency = 'EUR' WHERE currency IS NULL;
 *   UPDATE price_cache SET price = current_price WHERE price IS NULL AND current_price IS NOT NULL;
 *
 *   -- Replace the old (card_id, game) unique index with one that includes currency:
 *   DROP INDEX IF EXISTS price_cache_card_game_idx;
 *   CREATE UNIQUE INDEX IF NOT EXISTS price_cache_card_game_currency_idx
 *     ON price_cache (card_id, game, currency);
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { getPokemonCardById } from "./pokemon";
import { getMagicCardById, isScryfallError } from "./magic";
import { searchYugiohCards } from "./yugioh";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export interface PriceInfo {
  price: number | null;
  currency: string;
  source: string;
  lastUpdated: string;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function pick(map: Record<string, unknown> | null | undefined, ...keys: string[]): number | null {
  if (!map) return null;
  for (const key of keys) {
    const val = map[key];
    if (val !== null && val !== undefined && val !== 0 && val !== "0") {
      return typeof val === "string" ? parseFloat(val) : (val as number);
    }
  }
  return null;
}

async function readCache(
  cardId: string,
  game: string,
  currency: string
): Promise<PriceInfo | null> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("price_cache")
      .select("price, current_price, source, cached_at, currency")
      .eq("card_id", cardId)
      .eq("game", game)
      .eq("currency", currency)
      .maybeSingle();

    if (!data) return null;

    const age = Date.now() - new Date(data.cached_at as string).getTime();
    if (age >= CACHE_TTL_MS) return null;

    return {
      price: ((data.price ?? data.current_price) as number | null),
      currency: (data.currency as string | null) ?? currency,
      source: (data.source as string | null) ?? "cache",
      lastUpdated: data.cached_at as string,
    };
  } catch {
    return null;
  }
}

async function writeCache(payload: {
  card_id: string;
  game: string;
  currency: string;
  price: number | null;
  source: string;
  card_name: string;
  image_url: string | null;
}): Promise<void> {
  try {
    const now = new Date().toISOString();
    const supabase = createAdminClient();
    await supabase.from("price_cache").upsert(
      {
        ...payload,
        current_price: payload.price,
        cached_at: now,
        updated_at: now,
        price_history: [],
      },
      { onConflict: "card_id,game,currency" }
    );
  } catch {
    // Cache write is non-critical — never throw
  }
}

// ─── Pokémon ──────────────────────────────────────────────────────────────────

/**
 * Get Pokémon card price from cache or PokemonTCG.io.
 * EUR → prefers CardMarket prices.
 * USD → prefers TCGPlayer prices.
 */
export async function getPokemonCardPrice(
  cardId: string,
  currency: "EUR" | "USD" = "EUR"
): Promise<PriceInfo | null> {
  const cached = await readCache(cardId, "pokemon", currency);
  if (cached) return cached;

  // getPokemonCardById already includes cardmarketPrices and tcgplayerPrices.
  // Next.js deduplicates identical fetch calls within the same request, so
  // calling this from /api/card/[id] (which also fetches metadata) is free.
  const card = await getPokemonCardById(cardId);
  if (!card) return null;

  const cm = card.cardmarketPrices as Record<string, unknown> | null;
  const tcg = card.tcgplayerPrices as Record<string, Record<string, unknown>> | null;

  let price: number | null = null;
  let resolvedCurrency = currency;
  let source = "pokemontcg.io";

  if (currency === "EUR" && cm) {
    price = pick(cm, "averageSellPrice", "trendPrice", "avg1", "avg7", "avg30");
    source = "pokemontcg.io/cardmarket";
    resolvedCurrency = "EUR";
  }

  if ((price === null || currency === "USD") && tcg) {
    const variant =
      tcg.holofoil ?? tcg.normal ?? tcg.reverseHolofoil ?? Object.values(tcg)[0];
    price = pick(variant as Record<string, unknown>, "market", "mid", "low");
    source = "pokemontcg.io/tcgplayer";
    resolvedCurrency = "USD";
  }

  // EUR fallback if USD was requested but unavailable
  if (price === null && cm) {
    price = pick(cm, "averageSellPrice", "trendPrice", "avg1", "avg7", "avg30");
    source = "pokemontcg.io/cardmarket";
    resolvedCurrency = "EUR";
  }

  const now = new Date().toISOString();
  await writeCache({
    card_id: cardId,
    game: "pokemon",
    currency: resolvedCurrency,
    price,
    source,
    card_name: card.name,
    image_url: card.imageUrl,
  });

  return { price, currency: resolvedCurrency, source, lastUpdated: now };
}

// ─── Magic ────────────────────────────────────────────────────────────────────

/**
 * Get Magic card price from cache or Scryfall.
 * Scryfall exposes both EUR and USD natively.
 */
export async function getMagicCardPrice(
  cardId: string,
  currency: "EUR" | "USD" = "EUR"
): Promise<PriceInfo | null> {
  const cached = await readCache(cardId, "magic", currency);
  if (cached) return cached;

  const card = await getMagicCardById(cardId);
  if (!card || isScryfallError(card)) return null;

  let price: number | null = null;
  let resolvedCurrency = currency;

  if (currency === "EUR") {
    price = card.prices.eur ?? card.prices.eurFoil ?? null;
    if (price === null) {
      price = card.prices.usd ?? card.prices.usdFoil ?? null;
      resolvedCurrency = "USD";
    }
  } else {
    price = card.prices.usd ?? card.prices.usdFoil ?? null;
    if (price === null) {
      price = card.prices.eur ?? card.prices.eurFoil ?? null;
      resolvedCurrency = "EUR";
    }
  }

  const now = new Date().toISOString();
  await writeCache({
    card_id: cardId,
    game: "magic",
    currency: resolvedCurrency,
    price,
    source: "scryfall",
    card_name: card.name,
    image_url: card.imageUrl,
  });

  return {
    price,
    currency: resolvedCurrency,
    source: "scryfall",
    lastUpdated: now,
  };
}

// ─── Yu-Gi-Oh! ───────────────────────────────────────────────────────────────

// Minimal raw shape needed for direct passcode lookup
interface RawYgoCardMin {
  name: string;
  card_images?: Array<{ image_url_small?: string; image_url?: string }>;
  card_prices?: Array<{ cardmarket_price?: string; tcgplayer_price?: string }>;
}

function mapYgoMin(raw: RawYgoCardMin): { name: string; imageUrl: string; price: number | null } {
  const prices = raw.card_prices?.[0];
  const parseP = (v: string | undefined): number | null => {
    const n = parseFloat(v ?? "");
    return isNaN(n) || n <= 0 ? null : n;
  };
  return {
    name: raw.name,
    imageUrl: raw.card_images?.[0]?.image_url_small ?? raw.card_images?.[0]?.image_url ?? "",
    price: parseP(prices?.cardmarket_price) ?? parseP(prices?.tcgplayer_price) ?? null,
  };
}

/**
 * Get Yu-Gi-Oh! card price from cache or YGOPRODeck.
 * cardId can be a numeric passcode (e.g., "46986414") or a card name.
 * Prefers CardMarket (EUR) over TCGPlayer (USD).
 */
export async function getYugiohCardPrice(
  cardId: string,
  currency: "EUR" | "USD" = "EUR"
): Promise<PriceInfo | null> {
  const cached = await readCache(cardId, "yugioh", currency);
  if (cached) return cached;

  let card: { name: string; imageUrl: string; price: number | null } | null = null;

  // Numeric passcode → use the faster ?id= endpoint
  if (/^\d+$/.test(cardId)) {
    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15_000);
      const res = await fetch(
        `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${encodeURIComponent(cardId)}`,
        { cache: "no-store", signal: controller.signal }
      );
      clearTimeout(t);
      if (res.ok) {
        const data = (await res.json()) as { data?: RawYgoCardMin[] };
        const raw = data.data?.[0];
        if (raw) card = mapYgoMin(raw);
      }
    } catch {
      // fall through to fname search
    }
  }

  // Name / fuzzy fallback via searchYugiohCards (uses fname= endpoint with timeout)
  if (!card) {
    const result = await searchYugiohCards(cardId, 1, 1).catch(() => null);
    card = result?.cards[0] ?? null;
  }

  if (!card) return null;

  const now = new Date().toISOString();
  await writeCache({
    card_id: cardId,
    game: "yugioh",
    currency,
    price: card.price,
    source: "ygoprodeck",
    card_name: card.name,
    image_url: card.imageUrl,
  });

  return { price: card.price, currency, source: "ygoprodeck", lastUpdated: now };
}

// ─── One Piece ────────────────────────────────────────────────────────────────

/**
 * One Piece TCG has no public market price API.
 * Returns null — no price data is available from any public source.
 */
export async function getOnePieceCardPrice(
  _cardId: string,
  _currency: "EUR" | "USD" = "EUR"
): Promise<PriceInfo | null> {
  return null;
}

// ─── Unified entry point ──────────────────────────────────────────────────────

/**
 * Unified price getter for any supported game.
 * Handles cache read/write internally via Supabase.
 */
export async function getCardPrice(
  game: "pokemon" | "magic" | "yugioh" | "onepiece",
  cardId: string,
  currency: "EUR" | "USD" = "EUR"
): Promise<PriceInfo | null> {
  if (game === "pokemon") return getPokemonCardPrice(cardId, currency);
  if (game === "magic") return getMagicCardPrice(cardId, currency);
  if (game === "yugioh") return getYugiohCardPrice(cardId, currency);
  if (game === "onepiece") return getOnePieceCardPrice(cardId, currency);
  return null;
}
