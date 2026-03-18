/**
 * Servicio de precios — lee de card_prices (TTL soft 1h) y escribe en price_history.
 *
 * Flujo de lectura:
 *   1. card_prices (DB) — si fetched_at < 1h devuelve fresco
 *   2. Caller hace live fetch y llama upsertPrices() + recordPriceHistory()
 *
 * El historial se acumula en price_history (un snapshot por día por carta/moneda).
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type { GameKey, ProviderPriceResult } from "@/lib/tcg/types";

// TTL soft de precios: 1 hora
const PRICE_TTL_MS = 60 * 60 * 1000;

// ─── Lectura de precios ────────────────────────────────────────────────────────

/**
 * Lee precios de card_prices para una lista de external_ids.
 * Solo devuelve los que tengan fetched_at < 1h (TTL soft).
 * Los que no estén o estén vencidos no aparecen en el Map.
 */
export async function getPricesFromDB(
  externalIds: string[],
  game: GameKey,
  currency: "EUR" | "USD"
): Promise<Map<string, ProviderPriceResult>> {
  const result = new Map<string, ProviderPriceResult>();
  if (externalIds.length === 0) return result;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("card_prices")
      .select("external_id, price, price_foil, source, fetched_at")
      .in("external_id", externalIds)
      .eq("game", game)
      .eq("currency", currency);

    if (error) {
      logger.warn("[prices] getPricesFromDB error:", error.message);
      return result;
    }

    const now = Date.now();
    for (const row of data ?? []) {
      const age = now - new Date(row.fetched_at as string).getTime();
      if (age < PRICE_TTL_MS) {
        result.set(row.external_id as string, {
          externalId: row.external_id as string,
          game,
          currency,
          price: row.price as number | null,
          priceFoil: row.price_foil as number | null,
          source: row.source as string,
        });
      }
    }
  } catch (err) {
    logger.warn("[prices] getPricesFromDB exception:", err instanceof Error ? err.message : err);
  }

  return result;
}

/**
 * Obtiene el precio de una sola carta desde card_prices.
 * Devuelve null si no existe o está vencido.
 */
export async function getSinglePriceFromDB(
  externalId: string,
  game: GameKey,
  currency: "EUR" | "USD"
): Promise<ProviderPriceResult | null> {
  const map = await getPricesFromDB([externalId], game, currency);
  return map.get(externalId) ?? null;
}

// ─── Escritura de precios ──────────────────────────────────────────────────────

/**
 * Inserta o actualiza precios en card_prices.
 * Idempotente: ON CONFLICT (external_id, game, currency) DO UPDATE.
 */
export async function upsertPrices(prices: ProviderPriceResult[]): Promise<void> {
  if (prices.length === 0) return;

  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const rows = prices
      .filter((p) => p.price !== null || p.priceFoil !== null) // no guardar nulos sin sentido
      .map((p) => ({
        external_id: p.externalId,
        game: p.game,
        currency: p.currency,
        price: p.price,
        price_foil: p.priceFoil,
        source: p.source,
        fetched_at: now,
      }));

    if (rows.length === 0) return;

    const { error } = await supabase
      .from("card_prices")
      .upsert(rows, { onConflict: "external_id,game,currency" });

    if (error) {
      logger.warn("[prices] upsertPrices error:", error.message);
    }
  } catch (err) {
    logger.warn("[prices] upsertPrices exception:", err instanceof Error ? err.message : err);
  }
}

// ─── Historial de precios ──────────────────────────────────────────────────────

/**
 * Guarda un snapshot diario en price_history.
 * UPSERT con ON CONFLICT DO NOTHING — máximo un snapshot por (carta, moneda, día).
 * Puede llamarse múltiples veces al día con seguridad.
 */
export async function recordPriceHistory(
  externalId: string,
  game: GameKey,
  currency: "EUR" | "USD",
  price: number,
  source: string
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    await supabase.from("price_history").upsert(
      {
        external_id: externalId,
        game,
        currency,
        price,
        source,
        snapshot_date: today,
      },
      { onConflict: "external_id,game,currency,snapshot_date", ignoreDuplicates: true }
    );
  } catch {
    // No crítico — el historial es best-effort
  }
}

/**
 * Lee el historial de precios de una carta (últimos N días).
 */
export async function getPriceHistory(
  externalId: string,
  game: GameKey,
  currency: "EUR" | "USD",
  days = 30
): Promise<{ date: string; price: number }[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("price_history")
      .select("price, snapshot_date")
      .eq("external_id", externalId)
      .eq("game", game)
      .eq("currency", currency)
      .order("snapshot_date", { ascending: true })
      .limit(days);

    if (error) {
      logger.warn("[prices] getPriceHistory error:", error.message);
      return [];
    }

    return (data ?? []).map((r) => ({
      date: r.snapshot_date as string,
      price: Number(r.price),
    }));
  } catch {
    return [];
  }
}

// ─── Cartas con acceso reciente ───────────────────────────────────────────────

/**
 * Devuelve los external_ids de las cartas accedidas más recientemente para un juego.
 * Usado por el cron refresh-prices para saber qué cartas priorizar.
 */
export async function getRecentlyAccessedCardIds(
  game: GameKey,
  limit = 200
): Promise<string[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("card_access_log")
      .select("external_id")
      .eq("game", game)
      .order("accessed_at", { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn("[prices] getRecentlyAccessedCardIds error:", error.message);
      return [];
    }

    return (data ?? []).map((r) => r.external_id as string);
  } catch {
    return [];
  }
}
