/**
 * Servicio de catálogo — fuente principal de datos de cartas.
 *
 * Flujo de lectura:
 *   1. Redis (hot cache, 7 días)
 *   2. tcg_cards table (DB local)
 *   3. Provider externo (fallback on-demand) → guarda en DB + registra acceso
 *
 * El frontend nunca llega al paso 3 una vez el catálogo está sincronizado.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { redisGet, redisSet } from "@/lib/redis";
import { logger } from "@/lib/logger";
import type { GameKey, ProviderCardResult, ProviderSetResult } from "@/lib/tcg/types";

// Catálogo es estable — 7 días de TTL en Redis
const CATALOG_REDIS_TTL_SECONDS = 60 * 60 * 24 * 7;
// Resultados de búsqueda — 24 horas (puede haber cartas nuevas en syncs diarios)
const SEARCH_REDIS_TTL_SECONDS = 60 * 60 * 24;
// TTL soft de precios en card_prices — 1 hora en ms para comparación
export const PRICE_TTL_MS = 60 * 60 * 1000;

// ─── Tipos internos ────────────────────────────────────────────────────────────

interface DbCardRow {
  id: string;
  external_id: string;
  game: string;
  external_set_id: string | null;
  name: string;
  image_small: string | null;
  image_large: string | null;
  rarity: string | null;
  type_line: string | null;
  number: string | null;
  artist: string | null;
  raw_data: Record<string, unknown>;
}

interface DbSetRow {
  id: string;
  external_id: string;
  game: string;
  name: string;
  series: string | null;
  printed_total: number | null;
  total: number | null;
  release_date: string | null;
  symbol_url: string | null;
  logo_url: string | null;
  raw_data: Record<string, unknown>;
}

// ─── Mappers ───────────────────────────────────────────────────────────────────

function dbRowToCard(row: DbCardRow): ProviderCardResult {
  return {
    externalId: row.external_id,
    name: row.name,
    imageSmall: row.image_small ?? "",
    imageLarge: row.image_large ?? null,
    rarity: row.rarity ?? "Unknown",
    typeLine: row.type_line ?? "",
    setExternalId: row.external_set_id ?? null,
    setName: null, // join con tcg_sets sólo cuando se necesite explícitamente
    number: row.number ?? null,
    artist: row.artist ?? null,
    raw: row.raw_data ?? {},
  };
}

function dbRowToSet(row: DbSetRow): ProviderSetResult {
  return {
    externalId: row.external_id,
    name: row.name,
    series: row.series,
    printedTotal: row.printed_total,
    total: row.total,
    releaseDate: row.release_date,
    symbolUrl: row.symbol_url,
    logoUrl: row.logo_url,
    raw: row.raw_data ?? {},
  };
}

// ─── Búsqueda en DB ────────────────────────────────────────────────────────────

/**
 * Busca cartas en la DB local usando fulltext sobre el nombre.
 * Devuelve vacío si no hay resultados (el caller hace fallback al provider).
 */
export async function searchFromDB(
  query: string,
  game: GameKey,
  page: number,
  pageSize: number
): Promise<{ cards: ProviderCardResult[]; total: number }> {
  try {
    const supabase = createAdminClient();
    const offset = (page - 1) * pageSize;

    const { data, count, error } = await supabase
      .from("tcg_cards")
      .select("*", { count: "exact" })
      .eq("game", game)
      .textSearch("name", query, { type: "websearch", config: "simple" })
      .range(offset, offset + pageSize - 1);

    if (error) {
      logger.warn("[catalog] searchFromDB error:", error.message);
      return { cards: [], total: 0 };
    }

    return {
      cards: (data as DbCardRow[] ?? []).map(dbRowToCard),
      total: count ?? 0,
    };
  } catch (err) {
    logger.warn("[catalog] searchFromDB exception:", err instanceof Error ? err.message : err);
    return { cards: [], total: 0 };
  }
}

// ─── Detalle de carta ──────────────────────────────────────────────────────────

/**
 * Obtiene una carta de la DB local por external_id y game.
 * Usa Redis como hot cache; cae a Supabase si hay miss.
 */
export async function getCardFromDB(
  externalId: string,
  game: GameKey
): Promise<ProviderCardResult | null> {
  const cacheKey = `catalog:${game}:${externalId}`;

  // 1. Redis hot cache
  const cached = await redisGet<ProviderCardResult>(cacheKey);
  if (cached) return cached;

  // 2. Supabase
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tcg_cards")
      .select("*")
      .eq("game", game)
      .eq("external_id", externalId)
      .maybeSingle();

    if (error) {
      logger.warn("[catalog] getCardFromDB error:", error.message);
      return null;
    }
    if (!data) return null;

    const result = dbRowToCard(data as DbCardRow);
    await redisSet(cacheKey, result, { ex: CATALOG_REDIS_TTL_SECONDS });
    return result;
  } catch (err) {
    logger.warn("[catalog] getCardFromDB exception:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Upsert de cartas ──────────────────────────────────────────────────────────

/**
 * Inserta o actualiza cartas en tcg_cards.
 * Idempotente: usa ON CONFLICT (game, external_id) DO UPDATE.
 * Procesa en chunks de 500 para no exceder límites de Supabase.
 */
export async function upsertCards(
  cards: ProviderCardResult[],
  game: GameKey
): Promise<void> {
  if (cards.length === 0) return;

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const rows = cards.map((c) => ({
    external_id: c.externalId,
    game,
    external_set_id: c.setExternalId,
    name: c.name,
    image_small: c.imageSmall || null,
    image_large: c.imageLarge || null,
    rarity: c.rarity || null,
    type_line: c.typeLine || null,
    number: c.number || null,
    artist: c.artist || null,
    raw_data: c.raw,
    synced_at: now,
  }));

  // Chunked para no exceder el límite de payload de PostgREST
  const CHUNK_SIZE = 500;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const { error } = await supabase
      .from("tcg_cards")
      .upsert(rows.slice(i, i + CHUNK_SIZE), {
        onConflict: "game,external_id",
        ignoreDuplicates: false, // actualizar synced_at en cada sync
      });

    if (error) {
      logger.warn(`[catalog] upsertCards error (chunk ${i}):`, error.message);
    }
  }
}

// ─── Upsert de sets ────────────────────────────────────────────────────────────

/** Inserta o actualiza sets en tcg_sets. Idempotente. */
export async function upsertSets(
  sets: ProviderSetResult[],
  game: GameKey
): Promise<void> {
  if (sets.length === 0) return;

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const rows = sets.map((s) => ({
    external_id: s.externalId,
    game,
    name: s.name,
    series: s.series,
    printed_total: s.printedTotal,
    total: s.total,
    release_date: s.releaseDate,
    symbol_url: s.symbolUrl,
    logo_url: s.logoUrl,
    raw_data: s.raw,
    synced_at: now,
  }));

  const { error } = await supabase
    .from("tcg_sets")
    .upsert(rows, { onConflict: "game,external_id", ignoreDuplicates: false });

  if (error) {
    logger.warn("[catalog] upsertSets error:", error.message);
  }
}

// ─── Lectura de sets ───────────────────────────────────────────────────────────

/** Lee sets de la DB local para un juego, ordenados por fecha de lanzamiento descendente. */
export async function getSetsFromDB(game: GameKey): Promise<ProviderSetResult[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("tcg_sets")
      .select("*")
      .eq("game", game)
      .order("release_date", { ascending: false });

    if (error) {
      logger.warn("[catalog] getSetsFromDB error:", error.message);
      return [];
    }
    return (data as DbSetRow[] ?? []).map(dbRowToSet);
  } catch (err) {
    logger.warn("[catalog] getSetsFromDB exception:", err instanceof Error ? err.message : err);
    return [];
  }
}

// ─── Registro de acceso ────────────────────────────────────────────────────────

/**
 * Registra que una carta fue accedida.
 * El cron refresh-prices usa esto para priorizar el refresh de precios.
 * Es un UPSERT — solo guarda el acceso más reciente por carta.
 */
export async function logCardAccess(
  externalId: string,
  game: GameKey
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from("card_access_log")
      .upsert(
        { external_id: externalId, game, accessed_at: new Date().toISOString() },
        { onConflict: "external_id,game" }
      );
  } catch {
    // No crítico — nunca bloquear una request por esto
  }
}

/**
 * Registra múltiples accesos de una sola vez (búsqueda que retorna N cartas).
 */
export async function logCardAccessBatch(
  externalIds: string[],
  game: GameKey
): Promise<void> {
  if (externalIds.length === 0) return;
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    const rows = externalIds.map((id) => ({
      external_id: id,
      game,
      accessed_at: now,
    }));
    await supabase
      .from("card_access_log")
      .upsert(rows, { onConflict: "external_id,game" });
  } catch {
    // No crítico
  }
}

// ─── Cache key para búsqueda en Redis ─────────────────────────────────────────

export function buildSearchCacheKey(game: string, query: string, page: number, pageSize: number) {
  return `cards:${game}:${query}:${page}:${pageSize}`;
}

export { SEARCH_REDIS_TTL_SECONDS };
