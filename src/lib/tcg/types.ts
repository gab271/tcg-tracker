/**
 * Contratos comunes para todos los adaptadores de proveedores TCG.
 * Cualquier módulo que quiera añadir un nuevo juego debe implementar TCGProvider.
 */

export type GameKey = "pokemon" | "magic" | "yugioh" | "onepiece";

// ─── Resultado de búsqueda / catálogo ────────────────────────────────────────

/** Datos mínimos de una carta para listados y catálogo */
export interface ProviderCardResult {
  externalId: string;
  name: string;
  imageSmall: string;
  imageLarge: string | null;
  rarity: string;
  typeLine: string;
  setExternalId: string | null;
  setName: string | null;
  number: string | null;
  artist: string | null;
  /** Payload crudo completo del provider — se guarda en tcg_cards.raw_data */
  raw: Record<string, unknown>;
}

/** Carta con precios inline — usada en el endpoint de detalle */
export interface ProviderCardDetail extends ProviderCardResult {
  prices: ProviderPriceResult[];
}

// ─── Precios ─────────────────────────────────────────────────────────────────

export interface ProviderPriceResult {
  externalId: string;
  game: GameKey;
  currency: "EUR" | "USD";
  price: number | null;
  priceFoil: number | null;
  source: string;
}

// ─── Sets ─────────────────────────────────────────────────────────────────────

export interface ProviderSetResult {
  externalId: string;
  name: string;
  series: string | null;
  printedTotal: number | null;
  total: number | null;
  releaseDate: string | null;
  symbolUrl: string | null;
  logoUrl: string | null;
  /** Payload crudo — se guarda en tcg_sets.raw_data */
  raw: Record<string, unknown>;
}

// ─── Opciones de llamada ──────────────────────────────────────────────────────

export interface ProviderSearchOptions {
  query: string;
  page?: number;
  pageSize?: number;
}

export interface ProviderSearchResult {
  cards: ProviderCardResult[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface BulkIngestOptions {
  /** Cursor para reanudar desde donde se interrumpió (número de página como string) */
  cursor?: string;
  /** Cartas por página en ingest masivo */
  pageSize?: number;
}

export interface BulkIngestPage {
  cards: ProviderCardResult[];
  /** Cursor para la siguiente página; null si esta es la última */
  nextCursor: string | null;
  /** Estimación del total de cartas disponibles */
  totalEstimate: number | null;
}

// ─── Interfaz del provider ────────────────────────────────────────────────────

/**
 * Interfaz que todos los adaptadores de juego deben implementar.
 *
 * - searchCards / getCardById: usados como fallback on-demand cuando la carta
 *   no está en la DB local todavía.
 * - getAllCards: ingest masivo paginado, llamado por los cron jobs de sync.
 * - getCardPrices: batch de precios, llamado por el cron refresh-prices.
 * - getSets: listado de expansiones, llamado por el cron sync y por /api/pokemon-sets.
 *
 * Los providers sin precios (One Piece) devuelven [] en getCardPrices.
 * Los providers sin sets (Yu-Gi-Oh) devuelven [] en getSets.
 */
export interface TCGProvider {
  readonly game: GameKey;
  readonly providerName: string;

  /** Búsqueda por nombre — fallback on-demand desde /api/cards */
  searchCards(options: ProviderSearchOptions): Promise<ProviderSearchResult>;

  /** Detalle de una carta por su external_id — fallback on-demand desde /api/card/[id] */
  getCardById(externalId: string): Promise<ProviderCardDetail | null>;

  /**
   * Ingest masivo paginado.
   * Llamado iterativamente por los cron jobs; cada llamada devuelve una página
   * y un cursor. El cron guarda el cursor en provider_sync_state y lo pasa en
   * la siguiente invocación para reanudar tras un crash o timeout.
   */
  getAllCards(options?: BulkIngestOptions): Promise<BulkIngestPage>;

  /**
   * Precios en batch por lista de external_ids.
   * Llamado por el cron refresh-prices para las cartas accedidas recientemente.
   */
  getCardPrices(externalIds: string[]): Promise<ProviderPriceResult[]>;

  /** Todos los sets del juego */
  getSets(): Promise<ProviderSetResult[]>;
}
