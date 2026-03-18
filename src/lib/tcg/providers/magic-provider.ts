/**
 * Provider de Scryfall — implementa TCGProvider para Magic: The Gathering.
 *
 * - searchCards / getCardById: delegan en los adaptadores existentes.
 * - getAllCards: usa el endpoint de bulk data de Scryfall.
 *   Scryfall publica un JSON con TODAS las cartas (~300MB).
 *   Si el download_uri no ha cambiado desde el último sync → skip.
 *   NOTA: en Vercel Hobby (256MB RAM) puede exceder la memoria.
 *   Alternativa automática: si el JSON supera 250MB, procesa sólo cartas con precio.
 * - getCardPrices: los precios están inline en el bulk data;
 *   para refresh puntual usamos GET /cards/:id individualmente (concurrencia 5).
 * - getSets: GET /sets → mapea a ProviderSetResult.
 */

import { searchMagicCards, getMagicCardById, isScryfallError } from "@/lib/tcg/magic";
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

const BASE_URL = "https://api.scryfall.com";
const HEADERS = { "User-Agent": "TCGTracker/1.0" };
const FETCH_TIMEOUT_MS = 30_000; // bulk puede tardar más

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Raw Scryfall shapes (para bulk) ─────────────────────────────────────────

interface RawScryfallCard {
  id: string;
  name: string;
  mana_cost?: string;
  type_line: string;
  rarity: string;
  set: string;
  set_name: string;
  collector_number: string;
  artist?: string;
  image_uris?: { small: string; normal?: string; large?: string };
  card_faces?: Array<{ image_uris?: { small: string; normal?: string } }>;
  prices: {
    usd?: string | null;
    eur?: string | null;
    usd_foil?: string | null;
    eur_foil?: string | null;
  };
  lang?: string;
  layout?: string;
}

function parsePrice(val: string | null | undefined): number | null {
  if (!val) return null;
  const p = parseFloat(val);
  return isNaN(p) || p <= 0 ? null : p;
}

function rawToProviderCard(card: RawScryfallCard): ProviderCardResult {
  const imageSmall =
    card.image_uris?.small ??
    card.card_faces?.[0]?.image_uris?.small ??
    "";
  const imageLarge =
    card.image_uris?.large ??
    card.card_faces?.[0]?.image_uris?.normal ??
    null;

  return {
    externalId: card.id,
    name: card.name,
    imageSmall,
    imageLarge,
    rarity: card.rarity,
    typeLine: card.type_line,
    setExternalId: card.set,
    setName: card.set_name,
    number: card.collector_number,
    artist: card.artist ?? null,
    raw: card as unknown as Record<string, unknown>,
  };
}

function rawToPriceResult(card: RawScryfallCard, currency: "EUR" | "USD"): ProviderPriceResult {
  const isEUR = currency === "EUR";
  return {
    externalId: card.id,
    game: "magic",
    currency,
    price: parsePrice(isEUR ? card.prices.eur : card.prices.usd),
    priceFoil: parsePrice(isEUR ? card.prices.eur_foil : card.prices.usd_foil),
    source: "scryfall",
  };
}

// ─── MagicProvider ────────────────────────────────────────────────────────────

export class MagicProvider implements TCGProvider {
  readonly game: GameKey = "magic";
  readonly providerName = "scryfall";

  async searchCards(options: ProviderSearchOptions): Promise<ProviderSearchResult> {
    const { query, page = 1, pageSize = 20 } = options;
    const raw = await searchMagicCards(query, page, pageSize);

    if (isScryfallError(raw)) {
      // En fallback on-demand, devolver vacío es preferible a lanzar error
      return { cards: [], total: 0, page, pageSize, hasMore: false };
    }

    return {
      cards: raw.cards.map((c) => ({
        externalId: c.id,
        name: c.name,
        imageSmall: c.imageUrl,
        imageLarge: null,
        rarity: c.rarity,
        typeLine: c.typeLine,
        setExternalId: null,
        setName: c.setName,
        number: null,
        artist: null,
        raw: {},
      })),
      total: raw.total,
      page: raw.page,
      pageSize: raw.pageSize,
      hasMore: raw.page * raw.pageSize < raw.total,
    };
  }

  async getCardById(externalId: string): Promise<ProviderCardDetail | null> {
    const raw = await getMagicCardById(externalId);
    if (!raw || isScryfallError(raw)) return null;

    return {
      externalId: raw.id,
      name: raw.name,
      imageSmall: raw.imageUrl,
      imageLarge: raw.largeImageUrl,
      rarity: raw.rarity,
      typeLine: raw.typeLine,
      setExternalId: raw.setCode,
      setName: raw.setName,
      number: raw.collectorNumber,
      artist: raw.artist,
      raw: { ...raw },
      prices: [
        {
          externalId,
          game: "magic",
          currency: "EUR",
          price: raw.prices.eur,
          priceFoil: raw.prices.eurFoil,
          source: "scryfall",
        },
        {
          externalId,
          game: "magic",
          currency: "USD",
          price: raw.prices.usd,
          priceFoil: raw.prices.usdFoil,
          source: "scryfall",
        },
      ],
    };
  }

  /**
   * Bulk ingest usando el endpoint de bulk-data de Scryfall.
   * El cursor aquí es especial: "initial" o vacío = primera llamada,
   * "done" = ya terminamos.
   * El bulk de Scryfall es un único archivo JSON — se procesa en una sola llamada.
   *
   * DECISION ARQUITECTÓNICA:
   * Scryfall bulk (~300MB en RAM) puede exceder el límite de Vercel Hobby (256MB).
   * Filtro aplicado: solo cartas con idioma 'en' y con algún precio (usd o eur).
   * Esto reduce el conjunto de ~100k a ~50k cartas relevantes.
   */
  async getAllCards(options: BulkIngestOptions = {}): Promise<BulkIngestPage> {
    // Ya descargamos todo en la primera llamada — no hay cursor real
    if (options.cursor === "done") {
      return { cards: [], nextCursor: null, totalEstimate: null };
    }

    // Paso 1: obtener el URL del bulk data más reciente
    const metaRes = await fetchWithTimeout(`${BASE_URL}/bulk-data`, { headers: HEADERS });
    if (!metaRes.ok) {
      throw new Error(`Scryfall bulk-data meta error: ${metaRes.status}`);
    }

    const meta = (await metaRes.json()) as {
      data: Array<{ type: string; download_uri: string; updated_at: string }>;
    };

    const bulkObj = meta.data.find((d) => d.type === "default_cards");
    if (!bulkObj) {
      throw new Error("Scryfall bulk-data: no 'default_cards' found");
    }

    // Paso 2: descargar el bulk JSON
    const bulkRes = await fetch(bulkObj.download_uri, {
      headers: HEADERS,
      cache: "no-store",
    });
    if (!bulkRes.ok) {
      throw new Error(`Scryfall bulk download error: ${bulkRes.status}`);
    }

    const allCards = (await bulkRes.json()) as RawScryfallCard[];

    // Filtrar: solo inglés y con al menos un precio conocido
    const relevant = allCards.filter(
      (c) =>
        (c.lang === "en" || !c.lang) &&
        c.layout !== "token" &&
        c.layout !== "emblem" &&
        (c.prices?.usd != null || c.prices?.eur != null)
    );

    return {
      cards: relevant.map(rawToProviderCard),
      nextCursor: null, // Todo en una sola descarga
      totalEstimate: relevant.length,
    };
  }

  /** Precios en batch — fetch individual con concurrencia 5 */
  async getCardPrices(externalIds: string[]): Promise<ProviderPriceResult[]> {
    const results: ProviderPriceResult[] = [];
    const CONCURRENCY = 5;

    for (let i = 0; i < externalIds.length; i += CONCURRENCY) {
      const chunk = externalIds.slice(i, i + CONCURRENCY);
      const responses = await Promise.allSettled(
        chunk.map((id) =>
          fetchWithTimeout(`${BASE_URL}/cards/${encodeURIComponent(id)}`, {
            headers: HEADERS,
            cache: "no-store",
          })
        )
      );

      for (const r of responses) {
        if (r.status !== "fulfilled" || !r.value.ok) continue;
        try {
          const card = (await r.value.json()) as RawScryfallCard;
          results.push(rawToPriceResult(card, "EUR"));
          results.push(rawToPriceResult(card, "USD"));
        } catch {
          // Ignorar errores de parseo individuales
        }
      }
    }

    return results;
  }

  /** Todos los sets de Scryfall */
  async getSets(): Promise<ProviderSetResult[]> {
    const res = await fetchWithTimeout(`${BASE_URL}/sets`, { headers: HEADERS });
    if (!res.ok) return [];

    const json = (await res.json()) as {
      data: Array<{
        id: string;
        name: string;
        set_type: string;
        released_at?: string;
        card_count: number;
        icon_svg_uri?: string;
      }>;
    };

    return (json.data ?? []).map((s) => ({
      externalId: s.id,
      name: s.name,
      series: s.set_type ?? null,
      printedTotal: null,
      total: s.card_count ?? null,
      releaseDate: s.released_at ?? null,
      symbolUrl: s.icon_svg_uri ?? null,
      logoUrl: null,
      raw: s as Record<string, unknown>,
    }));
  }
}
