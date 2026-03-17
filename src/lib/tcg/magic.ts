const BASE_URL = "https://api.scryfall.com";

const HEADERS = { "User-Agent": "TCGTracker/1.0" };

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MagicCardSummary {
  id: string;
  name: string;
  imageUrl: string;
  manaCost: string | null;
  typeLine: string;
  rarity: string;
  setName: string;
}

export interface MagicCardDetail extends MagicCardSummary {
  oracleText: string | null;
  power: string | null;
  toughness: string | null;
  setCode: string;
  collectorNumber: string;
  artist: string | null;
  largeImageUrl: string | null;
  prices: {
    usd: number | null;
    eur: number | null;
    usdFoil: number | null;
    eurFoil: number | null;
  };
}

export interface ScryfallError {
  error: string;
  status: number;
}

export interface MagicSearchResult {
  cards: MagicCardSummary[];
  page: number;
  pageSize: number;
  total: number;
}

// ─── Raw Scryfall shapes (internal) ──────────────────────────────────────────

interface RawScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  type_line: string;
  rarity: string;
  set: string;
  set_name: string;
  collector_number: string;
  oracle_text?: string;
  power?: string;
  toughness?: string;
  artist?: string;
  image_uris?: { small: string; normal: string; large: string };
  card_faces?: Array<{ image_uris?: { small: string; normal: string } }>;
  prices: {
    usd?: string | null;
    eur?: string | null;
    usd_foil?: string | null;
    eur_foil?: string | null;
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(val: string | null | undefined): number | null {
  if (!val) return null;
  const p = parseFloat(val);
  return isNaN(p) ? null : p;
}

function getSmallImage(card: RawScryfallCard): string {
  return (
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.small ??
    ""
  );
}

function getLargeImage(card: RawScryfallCard): string | null {
  return (
    card.image_uris?.large ??
    card.card_faces?.[0]?.image_uris?.normal ??
    null
  );
}

function mapSummary(card: RawScryfallCard): MagicCardSummary {
  return {
    id: card.id,
    name: card.name,
    imageUrl: getSmallImage(card),
    manaCost: card.mana_cost ?? null,
    typeLine: card.type_line,
    rarity: card.rarity,
    setName: card.set_name,
  };
}

function mapDetail(card: RawScryfallCard): MagicCardDetail {
  return {
    ...mapSummary(card),
    oracleText: card.oracle_text ?? null,
    power: card.power ?? null,
    toughness: card.toughness ?? null,
    setCode: card.set,
    collectorNumber: card.collector_number,
    artist: card.artist ?? null,
    largeImageUrl: getLargeImage(card),
    prices: {
      usd: parsePrice(card.prices.usd),
      eur: parsePrice(card.prices.eur),
      usdFoil: parsePrice(card.prices.usd_foil),
      eurFoil: parsePrice(card.prices.eur_foil),
    },
  };
}

export function isScryfallError(val: unknown): val is ScryfallError {
  return typeof val === "object" && val !== null && "error" in val;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search Magic: The Gathering cards via Scryfall /cards/search.
 * Returns a ScryfallError on rate-limit or API failure instead of throwing,
 * so the caller can handle it gracefully.
 */
export async function searchMagicCards(
  query: string,
  page = 1,
  // Scryfall always returns up to 175 cards per page; we slice client-side
  pageSize = 20
): Promise<MagicSearchResult | ScryfallError> {
  try {
    const params = new URLSearchParams({ q: query, page: String(page) });

    const res = await fetch(`${BASE_URL}/cards/search?${params}`, {
      headers: HEADERS,
      cache: "no-store",
    });

    // Empty result set (not an error)
    if (res.status === 404) {
      return { cards: [], page, pageSize, total: 0 };
    }

    if (res.status === 429) {
      return { error: "Scryfall rate limit exceeded. Please retry later.", status: 429 };
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { details?: string };
      return {
        error: body.details ?? `Scryfall error ${res.status}`,
        status: res.status,
      };
    }

    const data = (await res.json()) as {
      total_cards: number;
      data: RawScryfallCard[];
    };

    return {
      cards: data.data.slice(0, pageSize).map(mapSummary),
      page,
      pageSize,
      total: data.total_cards,
    };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
      status: 500,
    };
  }
}

/**
 * Fetch a single Magic card with full detail + prices from Scryfall.
 * Returns null on 404, ScryfallError on rate-limit / API errors.
 */
export async function getMagicCardById(
  id: string
): Promise<MagicCardDetail | ScryfallError | null> {
  try {
    const res = await fetch(`${BASE_URL}/cards/${encodeURIComponent(id)}`, {
      headers: HEADERS,
      cache: "no-store",
    });

    if (res.status === 404) return null;

    if (res.status === 429) {
      return { error: "Scryfall rate limit exceeded. Please retry later.", status: 429 };
    }

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { details?: string };
      return {
        error: body.details ?? `Scryfall error ${res.status}`,
        status: res.status,
      };
    }

    const card = (await res.json()) as RawScryfallCard;
    return mapDetail(card);
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
      status: 500,
    };
  }
}
