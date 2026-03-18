/**
 * Provider de YGOPRODeck — implementa TCGProvider para Yu-Gi-Oh!
 *
 * - searchCards / getCardById: delegan en los adaptadores existentes.
 * - getAllCards: GET /cardinfo.php?num=500&offset=N — paginado por offset.
 *   ~15k cartas / 500 = ~30 páginas.
 * - getCardPrices: YGOPRODeck permite batch por IDs separados por `|` (máx 20).
 * - getSets: no disponible en YGOPRODeck → devuelve [].
 */

import { searchYugiohCards } from "@/lib/tcg/yugioh";
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

const BASE_URL = "https://db.ygoprodeck.com/api/v7";
const FETCH_TIMEOUT_MS = 20_000;
const BULK_PAGE_SIZE = 500;

interface RawYgoCard {
  id: number;
  name: string;
  type: string;
  card_images?: Array<{ image_url: string; image_url_small: string }>;
  card_sets?: Array<{ set_name: string; set_rarity: string }>;
  card_prices?: Array<{
    cardmarket_price: string;
    tcgplayer_price: string;
  }>;
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { cache: "no-store", signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("YGOPRODeck timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

function parsePrice(val: string | undefined | null): number | null {
  if (!val) return null;
  const n = parseFloat(val);
  return isNaN(n) || n <= 0 ? null : n;
}

function rawToProviderCard(card: RawYgoCard): ProviderCardResult {
  return {
    externalId: String(card.id),
    name: card.name,
    imageSmall:
      card.card_images?.[0]?.image_url_small ??
      card.card_images?.[0]?.image_url ??
      "",
    imageLarge: card.card_images?.[0]?.image_url ?? null,
    rarity: card.card_sets?.[0]?.set_rarity ?? "Common",
    typeLine: card.type ?? "",
    setExternalId: null,
    setName: card.card_sets?.[0]?.set_name ?? null,
    number: null,
    artist: null,
    raw: card as unknown as Record<string, unknown>,
  };
}

// ─── YugiohProvider ───────────────────────────────────────────────────────────

export class YugiohProvider implements TCGProvider {
  readonly game: GameKey = "yugioh";
  readonly providerName = "ygoprodeck";

  async searchCards(options: ProviderSearchOptions): Promise<ProviderSearchResult> {
    const { query, page = 1, pageSize = 20 } = options;
    const result = await searchYugiohCards(query, page, pageSize);
    return {
      cards: result.cards.map((c) => ({
        externalId: c.id,
        name: c.name,
        imageSmall: c.imageUrl,
        imageLarge: null,
        rarity: c.rarity,
        typeLine: c.typeLine,
        setExternalId: null,
        setName: null,
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

  async getCardById(externalId: string): Promise<ProviderCardDetail | null> {
    const res = await fetchWithTimeout(
      `${BASE_URL}/cardinfo.php?id=${encodeURIComponent(externalId)}`
    );
    if (res.status === 400 || res.status === 404) return null;
    if (!res.ok) throw new Error(`YGOPRODeck error: ${res.status}`);

    const json = (await res.json()) as { data?: RawYgoCard[] };
    const card = json.data?.[0];
    if (!card) return null;

    const prices = card.card_prices?.[0];
    const priceEUR = parsePrice(prices?.cardmarket_price);
    const priceUSD = parsePrice(prices?.tcgplayer_price);

    return {
      ...rawToProviderCard(card),
      prices: [
        {
          externalId,
          game: "yugioh",
          currency: "EUR",
          price: priceEUR,
          priceFoil: null,
          source: "ygoprodeck/cardmarket",
        },
        {
          externalId,
          game: "yugioh",
          currency: "USD",
          price: priceUSD,
          priceFoil: null,
          source: "ygoprodeck/tcgplayer",
        },
      ],
    };
  }

  /**
   * Ingest masivo paginado por offset.
   * cursor = offset como string (empieza en "0").
   */
  async getAllCards(options: BulkIngestOptions = {}): Promise<BulkIngestPage> {
    const offset = parseInt(options.cursor ?? "0", 10);
    const url = `${BASE_URL}/cardinfo.php?num=${BULK_PAGE_SIZE}&offset=${offset}`;

    const res = await fetchWithTimeout(url);

    // 400 cuando offset supera el total → última página
    if (res.status === 400) {
      return { cards: [], nextCursor: null, totalEstimate: null };
    }
    if (!res.ok) {
      throw new Error(`YGOPRODeck bulk error: ${res.status}`);
    }

    const json = (await res.json()) as {
      data?: RawYgoCard[];
      meta?: { total_rows?: number };
    };

    const cards = (json.data ?? []).map(rawToProviderCard);
    const total = json.meta?.total_rows ?? null;
    const nextOffset = offset + BULK_PAGE_SIZE;
    const nextCursor = cards.length === BULK_PAGE_SIZE ? String(nextOffset) : null;

    return {
      cards,
      nextCursor,
      totalEstimate: total,
    };
  }

  /**
   * Precios en batch — YGOPRODeck acepta múltiples IDs separados por `|`.
   * Máx 20 IDs por request según la documentación.
   */
  async getCardPrices(externalIds: string[]): Promise<ProviderPriceResult[]> {
    const results: ProviderPriceResult[] = [];
    const BATCH_SIZE = 20;

    for (let i = 0; i < externalIds.length; i += BATCH_SIZE) {
      const chunk = externalIds.slice(i, i + BATCH_SIZE);
      const idsParam = chunk.join("|");
      const url = `${BASE_URL}/cardinfo.php?id=${encodeURIComponent(idsParam)}`;

      try {
        const res = await fetchWithTimeout(url);
        if (!res.ok) continue;

        const json = (await res.json()) as { data?: RawYgoCard[] };
        for (const card of json.data ?? []) {
          const prices = card.card_prices?.[0];
          results.push({
            externalId: String(card.id),
            game: "yugioh",
            currency: "EUR",
            price: parsePrice(prices?.cardmarket_price),
            priceFoil: null,
            source: "ygoprodeck/cardmarket",
          });
          results.push({
            externalId: String(card.id),
            game: "yugioh",
            currency: "USD",
            price: parsePrice(prices?.tcgplayer_price),
            priceFoil: null,
            source: "ygoprodeck/tcgplayer",
          });
        }
      } catch {
        // Chunk fallido — continuar con el siguiente
      }
    }

    return results;
  }

  /** Yu-Gi-Oh no tiene endpoint de sets en YGOPRODeck */
  async getSets(): Promise<ProviderSetResult[]> {
    return [];
  }
}
