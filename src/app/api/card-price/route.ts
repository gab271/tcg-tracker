import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client (uses service role or anon key)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// ─── Helper: extract best available price ───────────────────────────────────
function pickPrice(prices: Record<string, any> | null | undefined, ...keys: string[]): number | null {
  if (!prices) return null;
  for (const key of keys) {
    const val = prices[key];
    if (val !== null && val !== undefined && val !== 0) {
      return typeof val === "string" ? parseFloat(val) : val;
    }
  }
  return null;
}

// ─── Helper: fetch Pokémon price from PokemonTCG.io (Cardmarket EUR) ────────
const pokemonApiHeaders: Record<string, string> = process.env.POKEMONTCG_API_KEY
  ? { "X-Api-Key": process.env.POKEMONTCG_API_KEY }
  : {};

async function fetchPokemonPrice(cardId: string) {
  // Primary: PokemonTCG.io — has Cardmarket EUR + TCGPlayer USD prices
  try {
    const res = await fetch(`https://api.pokemontcg.io/v2/cards/${cardId}`, { headers: pokemonApiHeaders });
    
    if (res.ok) {
      const data = await res.json();
      const card = data.data;
      return extractPokemonCardData(card, cardId);
    }
  } catch (err) {
    console.error("[card-price] PokemonTCG.io direct fetch failed:", err);
  }

  // Fallback: try searching by name (using * wildcard match)
  try {
    const searchUrl = `https://api.pokemontcg.io/v2/cards?q=name:${encodeURIComponent(cardId)}&pageSize=1`;
    console.log("[card-price] Searching PokemonTCG.io:", searchUrl);
    const searchRes = await fetch(searchUrl, { headers: pokemonApiHeaders });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      console.log("[card-price] Search results count:", searchData.data?.length ?? 0);
      if (searchData.data && searchData.data.length > 0) {
        return extractPokemonCardData(searchData.data[0], cardId);
      }
    } else {
      console.error("[card-price] Search failed with status:", searchRes.status);
    }
  } catch (err) {
    console.error("[card-price] PokemonTCG.io search failed:", err);
  }

  // Last resort: try TCGdex for name/image even if price is unavailable
  try {
    const fallback = await fetch(`https://api.tcgdex.net/v2/en/cards/${cardId}`);
    if (!fallback.ok) return null;
    
    const card = await fallback.json();
    return {
      currentPrice: null,
      currency: "EUR",
      source: "tcgdex",
      name: card?.name ?? cardId,
      image: card?.image ? `${card.image}/high.webp` : null,
    };
  } catch {
    return null;
  }
}

function extractPokemonCardData(card: any, cardId: string) {
  const cm = card?.cardmarket?.prices;
  const tcg = card?.tcgplayer?.prices;

  // Try Cardmarket EUR first, then TCGPlayer USD
  let price = pickPrice(cm, "averageSellPrice", "trendPrice", "avg1", "avg7", "avg30");
  let currency = "EUR";
  let source = "pokemontcg.io/cardmarket";

  if (price === null && tcg) {
    // TCGPlayer has sub-objects per variant (normal, holofoil, etc.)
    const variant = tcg.holofoil ?? tcg.normal ?? tcg.reverseHolofoil ?? tcg["1stEditionHolofoil"] ?? Object.values(tcg)[0];
    price = pickPrice(variant as any, "market", "mid", "low");
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

// ─── Helper: fetch Magic price from Scryfall ────────────────────────────────
async function fetchMagicPrice(cardId: string) {
  // Scryfall accepts set/collector-number or a UUID
  let card: any = null;

  const res = await fetch(`https://api.scryfall.com/cards/${cardId}`);
  if (res.ok) {
    card = await res.json();
  } else {
    // Try searching by name as fallback
    const search = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(cardId)}`
    );
    if (!search.ok) return null;
    card = await search.json();
  }

  // Try EUR prices first, then USD
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

// ─── Helper: generate synthetic 7-day price history ─────────────────────────
// In production this would come from stored daily snapshots in Supabase.
function generatePriceHistory(currentPrice: number | null): { date: string; price: number }[] {
  if (!currentPrice) return [];
  const history: { date: string; price: number }[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    // Simulate ±5% daily variance for demo
    const variance = 1 + (Math.random() * 0.1 - 0.05);
    history.push({
      date: date.toISOString().split("T")[0],
      price: parseFloat((currentPrice * variance).toFixed(2)),
    });
  }

  // Ensure the last entry matches the actual current price
  history[history.length - 1].price = currentPrice;
  return history;
}

// ─── GET /api/card-price?cardId=xxx&game=pokemon|magic ──────────────────────
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cardId = searchParams.get("cardId");
  const game = searchParams.get("game")?.toLowerCase();

  if (!cardId || !game) {
    return NextResponse.json(
      { error: "Missing required query params: cardId, game" },
      { status: 400 }
    );
  }

  if (!["pokemon", "magic"].includes(game)) {
    return NextResponse.json(
      { error: 'Unsupported game. Use "pokemon" or "magic".' },
      { status: 400 }
    );
  }

  // ── 1. Check Supabase cache ───────────────────────────────────────────────
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
    // Cache table might not exist yet — continue to live fetch
  }

  // ── 2. Fetch live price from external API ─────────────────────────────────
  let result;
  if (game === "pokemon") {
    result = await fetchPokemonPrice(cardId);
  } else {
    result = await fetchMagicPrice(cardId);
  }

  if (!result) {
    return NextResponse.json(
      { error: `Card "${cardId}" not found for game "${game}"` },
      { status: 404 }
    );
  }

  const priceHistory = generatePriceHistory(result.currentPrice);

  // ── 3. Upsert into Supabase cache ────────────────────────────────────────
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

  // ── 4. Return response ───────────────────────────────────────────────────
  return NextResponse.json({
    currentPrice: result.currentPrice,
    priceHistory,
    currency: "EUR",
    source: result.source,
    name: result.name,
    image: result.image,
    cached: false,
  });
}
