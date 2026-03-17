const BASE_URL = "https://db.ygoprodeck.com/api/v7";
const FETCH_TIMEOUT_MS = 15_000;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YugiohCardSummary {
  id: string;
  name: string;
  imageUrl: string;
  rarity: string;
  typeLine: string;
  price: number | null;
}

export interface YugiohSearchResult {
  cards: YugiohCardSummary[];
  page: number;
  pageSize: number;
  total: number;
}

// ─── Raw YGOPRODeck shapes ────────────────────────────────────────────────────

interface RawYgoCard {
  id: number;
  name: string;
  type: string;
  card_images?: Array<{
    image_url: string;
    image_url_small: string;
  }>;
  card_sets?: Array<{
    set_rarity: string;
  }>;
  card_prices?: Array<{
    cardmarket_price: string;
    tcgplayer_price: string;
    ebay_price: string;
    amazon_price: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(val: string | undefined | null): number | null {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) || n <= 0 ? null : n;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("YGOPRODeck API timed out");
    }
    throw new Error(`YGOPRODeck API unreachable: ${err instanceof Error ? err.message : err}`);
  } finally {
    clearTimeout(timeout);
  }
}

function mapCard(card: RawYgoCard): YugiohCardSummary {
  const prices = card.card_prices?.[0];
  const price =
    parsePrice(prices?.cardmarket_price) ??
    parsePrice(prices?.tcgplayer_price) ??
    null;

  return {
    id: String(card.id),
    name: card.name,
    imageUrl:
      card.card_images?.[0]?.image_url_small ??
      card.card_images?.[0]?.image_url ??
      "",
    rarity: card.card_sets?.[0]?.set_rarity ?? "Common",
    typeLine: card.type ?? "",
    price,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search Yu-Gi-Oh! cards via YGOPRODeck fuzzy name search.
 * YGOPRODeck returns all matching cards; we paginate client-side.
 */
export async function searchYugiohCards(
  query: string,
  page = 1,
  pageSize = 20
): Promise<YugiohSearchResult> {
  const url = `${BASE_URL}/cardinfo.php?fname=${encodeURIComponent(query)}`;
  const res = await fetchWithTimeout(url);

  // YGOPRODeck returns 400 when no cards match (not 404)
  if (res.status === 400) {
    return { cards: [], page, pageSize, total: 0 };
  }

  if (!res.ok) {
    throw new Error(`YGOPRODeck API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { data?: RawYgoCard[] };
  const allCards = data.data ?? [];

  const start = (page - 1) * pageSize;
  const pageCards = allCards.slice(start, start + pageSize);

  return {
    cards: pageCards.map(mapCard),
    page,
    pageSize,
    total: allCards.length,
  };
}
