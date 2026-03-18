/**
 * Provider de Bandai One Piece — implementa TCGProvider.
 *
 * LIMITACIONES:
 * - No existe API oficial con JSON estructurado para One Piece TCG.
 * - searchCards delega en el scraper HTML existente (frágil).
 * - getAllCards hace scraping de la galería completa; puede romperse si cambia el HTML.
 * - getCardPrices devuelve [] — no hay fuente pública de precios para One Piece.
 * - getSets devuelve [] — no hay endpoint de sets en Bandai.
 *
 * Esta implementación es exclusivamente un fallback de último recurso.
 * No debe ser la fuente principal del catálogo de One Piece.
 */

import { searchOnePieceCards } from "@/lib/tcg/onepiece";
import { logger } from "@/lib/logger";
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

const BASE_URL = "https://en.onepiece-cardgame.com";
const FETCH_TIMEOUT_MS = 20_000;

async function fetchWithTimeout(url: string, body?: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      method: body ? "POST" : "GET",
      body: body ?? undefined,
      cache: "no-store",
      signal: controller.signal,
      headers: {
        ...(body ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,*/*",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

function htmlSectionToCard(
  id: string,
  name: string,
  imgFile: string,
  rarity: string,
  typeLine: string
): ProviderCardResult {
  return {
    externalId: id,
    name,
    imageSmall: `${BASE_URL}/images/cardlist/card/${imgFile}`,
    imageLarge: `${BASE_URL}/images/cardlist/card/${imgFile}`,
    rarity,
    typeLine,
    setExternalId: id.split("-").slice(0, 1).join(""), // e.g. "OP01"
    setName: null,
    number: id.split("-").slice(1).join("-") ?? null,
    artist: null,
    raw: { id, name, rarity, typeLine },
  };
}

/** Parser HTML mínimo — igual al de onepiece.ts pero mapea a ProviderCardResult */
function parseHtmlToProviderCards(html: string): ProviderCardResult[] {
  const cards: ProviderCardResult[] = [];
  const sections = html.split('class="resultCol"').slice(1);

  for (const section of sections) {
    const idMatch = /data-src="#([A-Z0-9]+-\d+)"/.exec(section);
    const imgMatch = /data-src="\.\.\/images\/cardlist\/card\/([^"?]+)"/.exec(section);
    const nameMatch = /<div class="cardName">([^<]+)<\/div>/.exec(section);
    const rarityMatch = /<span>[^<]+<\/span>\s*\|\s*<span>([^<]+)<\/span>/.exec(section);
    const typeMatch =
      /<span>[^<]+<\/span>\s*\|\s*<span>[^<]+<\/span>\s*\|\s*<span>([^<]+)<\/span>/.exec(section);

    if (!idMatch || !nameMatch) continue;

    const id = idMatch[1];
    cards.push(
      htmlSectionToCard(
        id,
        nameMatch[1].trim(),
        imgMatch?.[1] ?? `${id}.png`,
        rarityMatch?.[1]?.trim() ?? "Common",
        typeMatch?.[1]?.trim() ?? "Character"
      )
    );
  }
  return cards;
}

// ─── OnePieceProvider ─────────────────────────────────────────────────────────

export class OnePieceProvider implements TCGProvider {
  readonly game: GameKey = "onepiece";
  readonly providerName = "bandai";

  async searchCards(options: ProviderSearchOptions): Promise<ProviderSearchResult> {
    const { query, page = 1, pageSize = 20 } = options;
    const result = await searchOnePieceCards(query, page, pageSize);
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

  /** Intenta obtener una carta individual desde el HTML de detalle de Bandai */
  async getCardById(externalId: string): Promise<ProviderCardDetail | null> {
    try {
      // Bandai no tiene un endpoint de detalle por ID con JSON.
      // Usamos el listado con el ID como filtro.
      const body = new URLSearchParams({ freewords: externalId });
      const res = await fetchWithTimeout(`${BASE_URL}/cardlist/`, body.toString());
      if (!res.ok) return null;

      const html = await res.text();
      const cards = parseHtmlToProviderCards(html);
      const card = cards.find((c) => c.externalId === externalId);
      if (!card) return null;

      return { ...card, prices: [] };
    } catch (err) {
      logger.warn("[onepiece-provider] getCardById failed:", err instanceof Error ? err.message : err);
      return null;
    }
  }

  /**
   * Ingest masivo — scraping del listado completo de Bandai.
   * ADVERTENCIA: frágil. Cualquier cambio en el HTML rompe este parser.
   * cursor no se usa (todo viene de una sola llamada POST sin parámetro de página).
   */
  async getAllCards(_options: BulkIngestOptions = {}): Promise<BulkIngestPage> {
    try {
      // POST sin freewords devuelve el listado completo
      const body = new URLSearchParams({ freewords: "" });
      const res = await fetchWithTimeout(`${BASE_URL}/cardlist/`, body.toString());
      if (!res.ok) {
        return { cards: [], nextCursor: null, totalEstimate: null };
      }

      const html = await res.text();
      const cards = parseHtmlToProviderCards(html);

      return {
        cards,
        nextCursor: null, // Todo en una llamada
        totalEstimate: cards.length,
      };
    } catch (err) {
      logger.warn("[onepiece-provider] getAllCards failed:", err instanceof Error ? err.message : err);
      return { cards: [], nextCursor: null, totalEstimate: null };
    }
  }

  /** Sin fuente pública de precios para One Piece */
  async getCardPrices(_externalIds: string[]): Promise<ProviderPriceResult[]> {
    return [];
  }

  /** Sin endpoint de sets en Bandai */
  async getSets(): Promise<ProviderSetResult[]> {
    return [];
  }
}
