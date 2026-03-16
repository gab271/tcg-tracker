import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/config";
import { logger } from "@/lib/logger";
import type { PriceHistoryEntry } from "@/types/database";

const supabase = createAdminClient();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface PriceResult {
  currentPrice: number | null;
  currency: string;
  source: string;
  name: string;
  image: string | null;
}

// --- Helper: extract best available price ---
function pickPrice(prices: Record<string, unknown> | null | undefined, ...keys: string[]): number | null {
  if (!prices) return null;
  for (const key of keys) {
    const val = prices[key];
    if (val !== null && val !== undefined && val !== 0) {
      return typeof val === "string" ? parseFloat(val) : (val as number);
    }
  }
  return null;
}

// --- Helper: fetch Pokemon price from PokemonTCG.io ---
const pokemonApiHeaders: Record<string, string> = serverEnv.POKEMONTCG_API_KEY
  ? { "X-Api-Key": serverEnv.POKEMONTCG_API_KEY }
  : {};

async function fetchPokemonPrice(cardId: string): Promise<PriceResult | null> {
  try {
    const res = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, { headers: pokemonApiHeaders });
    if (res.ok) {
      const data = await res.json();
      return extractPokemonCardData(data.data, cardId);
    }
  } catch (err) {
    logger.error("PokemonTCG.io direct fetch failed", err);
  }

  try {
    const searchUrl = `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(cardId)}&pageSize=1`;
    logger.debug("Searching PokemonTCG.io:", searchUrl);
    const searchRes = await fetch(searchUrl, { headers: pokemonApiHeaders });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      logger.debug("Search results count:", searchData.data?.length ?? 0);
      if (searchData.data && searchData.data.length > 0) {
        return extractPokemonCardData(searchData.data[0], cardId);
      }
    } else {
      logger.error("PokemonTCG.io search failed with status:", searchRes.status);
    }
  } catch (err) {
    logger.error("PokemonTCG.io search failed", err);
  }

  // Last resort: TCGdex for name/image even if price is unavailable
  try {
    const fallback = await fetch(`https://api.tcgdex.net/v2/en/cards/${cardId}`);
    if (!fallback.ok) return null;
    const card = await fallback.json();
    return {
      currentPrice: null,
      currency: "EUR",
      source: "tcgdex",
      name: (card?.name as string) ?? cardId,
      image: card?.image ? `${card.image}/high.webp` : null,
    };
  } catch {
    return null;
  }
}

interface PokemonCard {
  name?: string;
  images?: { small?: string };
  cardmarket?: { prices?: Record<string, unknown> };
  tcgplayer?: { prices?: Record<string, Record<string, unknown>> };
}

function extractPokemonCardData(card: PokemonCard, cardId: string): PriceResult {
  const cm = card?.cardmarket?.prices;
  const tcg = card?.tcgplayer?.prices;

  let price = pickPrice(cm, "averageSellPrice", "trendPrice", "avg1", "avg7", "avg30");
  let currency = "EUR";
  let source = "pokemontcg.io/cardmarket";

  if (price === null && tcg) {
    const variant = tcg.holofoil ?? tcg.normal ?? tcg.reverseHolofoil ?? tcg["1stEditionHolofoil"] ?? Object.values(tcg)[0];
    price = pickPrice(variant as Record<string, unknown>, "market", "mid", "low");
    currency = "USD";
    source = "pokemontcg.io/tcgplayer";
  }

  return {
    currentPrice: price,
    currency,
    source,
    name: card?.name ?? cardId,
    image: card?.images?.small ?? null,
  };
}

// --- Helper: fetch Magic price from Scryfall ---
interface ScryfallCard {
  name?: string;
  prices?: Record<string, unknown>;
  image_uris?: { small?: string };
  card_faces?: Array<{ image_uris?: { small?: string } }>;
}

async function fetchMagicPrice(cardId: string): Promise<PriceResult | null> {
  let card: ScryfallCard | null = null;

  const res = await fetch(`https://api.scryfall.com/cards/${cardId}`);
  if (res.ok) {
    card = await res.json();
  } else {
    const search = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardId)}`
    );
    if (!search.ok) return null;
    card = await search.json();
  }

  const prices = card?.prices;
  let price = pickPrice(prices, "eur", "eur_foil");
  let currency = "EUR";

  if (price === null) {
    price = pickPrice(prices, "usd", "usd_foil", "usd_etched");
    currency = "USD";
  }

  return {
    currentPrice: price,
    currency,
    source: "scryfall",
    name: card?.name ?? cardId,
    image: card?.image_uris?.small ?? card?.card_faces?.[0]?.image_uris?.small ?? null,
  };
}

// --- Helper: fetch Yu-Gi-Oh price from YGOPRODeck ---
interface YgoCard {
  name?: string;
  card_images?: Array<{ image_url?: string }>;
  card_prices?: Array<Record<string, string>>;
}

async function fetchYugiohPrice(cardId: string): Promise<PriceResult | null> {
  const extractCard = (card: YgoCard): PriceResult => {
    const prices = card.card_prices?.[0];
    const rawPrice = prices?.cardmarket_price ?? prices?.tcgplayer_price ?? prices?.ebay_price ?? null;
    const price = rawPrice && parseFloat(rawPrice) > 0 ? parseFloat(rawPrice) : null;
    return {
      currentPrice: price,
      currency: prices?.cardmarket_price ? "EUR" : "USD",
      source: "ygoprodeck",
      name: card.name ?? cardId,
      image: card.card_images?.[0]?.image_url ?? null,
    };
  };

  // Try by passcode / numeric id
  if (/^\d+$/.test(cardId)) {
    try {
      const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${cardId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.data?.[0]) return extractCard(data.data[0]);
      }
    } catch {
      // fall through to name search
    }
  }

  // Try by exact name
  try {
    const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cardId)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.data?.[0]) return extractCard(data.data[0]);
    }
  } catch {
    // fall through to fuzzy search
  }

  // Fuzzy name search
  try {
    const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?fname=${encodeURIComponent(cardId)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.data?.[0]) return null;
    return extractCard(data.data[0]);
  } catch {
    return null;
  }
}

// --- Helper: fetch One Piece card data from TCGdex (no market prices available) ---
async function fetchOnePiecePrice(cardId: string): Promise<PriceResult | null> {
  try {
    const res = await fetch(`https://api.tcgdex.net/v2/en/cards/${encodeURIComponent(cardId)}`);
    if (!res.ok) return null;
    const card = await res.json();
    return {
      currentPrice: null,
      currency: "EUR",
      source: "tcgdex",
      name: (card?.name as string) ?? cardId,
      image: card?.image ? `${card.image}/high.webp` : null,
    };
  } catch {
    return null;
  }
}

// --- Helper: generate synthetic 7-day price history ---
function generatePriceHistory(currentPrice: number | null): PriceHistoryEntry[] {
  if (!currentPrice) return [];
  const history: PriceHistoryEntry[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const variance = 1 + (Math.random() * 0.1 - 0.05);
    history.push({
      date: date.toISOString().split("T")[0],
      price: parseFloat((currentPrice * variance).toFixed(2)),
    });
  }

  history[history.length - 1].price = currentPrice;
  return history;
}

// --- Normalize game parameter to canonical keys ---
function normalizeGame(raw: string): string {
  const s = raw.toLowerCase().trim();
  if (s === "pokemon" || s === "pokémon" || s === "pkm") return "pokemon";
  if (s === "magic" || s === "magic: the gathering" || s === "mtg") return "magic";
  if (s === "yugioh" || s === "yu-gi-oh!" || s === "yu-gi-oh" || s === "ygo") return "yugioh";
  if (s === "onepiece" || s === "one piece" || s === "op" || s === "one piece tcg") return "onepiece";
  return s;
}

// --- GET /api/card-price?cardId=xxx&game=pokemon|magic|yugioh|onepiece ---
const VALID_GAMES = ["pokemon", "magic", "yugioh", "onepiece"] as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("cardId");
  const rawGame = searchParams.get("game");

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

  // 1. Check Supabase cache
  try {
    const { data: cached } = await supabase
      .from("price_cache")
      .select("*")
      .eq("card_id", cardId)
      .eq("game", game)
      .single();

    if (cached) {
      const cachedAt = new Date(cached.cached_at).getTime();
      const age = Date.now() - cachedAt;

      if (age < CACHE_TTL_MS) {
        return NextResponse.json({
          currentPrice: cached.current_price,
          priceHistory: cached.price_history,
          currency: "EUR",
          source: cached.source,
          name: cached.card_name,
          image: cached.image_url,
          cached: true,
          cachedAt: cached.cached_at,
        });
      }
    }
  } catch {
    // Cache table might not exist yet -- continue to live fetch
  }

  // 2. Fetch live price from external API
  let result: PriceResult | null;
  if (game === "pokemon") {
    result = await fetchPokemonPrice(cardId);
  } else if (game === "magic") {
    result = await fetchMagicPrice(cardId);
  } else if (game === "yugioh") {
    result = await fetchYugiohPrice(cardId);
  } else {
    result = await fetchOnePiecePrice(cardId);
  }

  if (!result) {
    return NextResponse.json(
      { error: `Card "${cardId}" not found for game "${game}"` },
      { status: 404 }
    );
  }

  const priceHistory = generatePriceHistory(result.currentPrice);

  // 3. Upsert into Supabase cache
  try {
    await supabase.from("price_cache").upsert(
      {
        card_id: cardId,
        game,
        card_name: result.name,
        current_price: result.currentPrice,
        price_history: priceHistory,
        source: result.source,
        image_url: result.image,
        cached_at: new Date().toISOString(),
      },
      { onConflict: "card_id,game" }
    );
  } catch {
    // Cache write failure is non-critical
  }

  // 4. Return response
  return NextResponse.json({
    currentPrice: result.currentPrice,
    priceHistory,
    currency: result.currency,
    source: result.source,
    name: result.name,
    image: result.image,
    cached: false,
  });
}
