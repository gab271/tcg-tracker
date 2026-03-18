/**
 * Servicio de estado de sincronización.
 * Los cron jobs llaman estas funciones para marcar el inicio, fin y error de cada sync.
 * La tabla provider_sync_state permite: reinicio tras crash, observabilidad y evitar dobles ejecuciones.
 */

import { createAdminClient } from "@/lib/supabase/admin";
import { logger } from "@/lib/logger";
import type { GameKey } from "@/lib/tcg/types";

export type SyncType = "full_catalog" | "sets" | "prices";

export interface SyncState {
  id: string;
  provider: string;
  game: GameKey;
  syncType: SyncType;
  status: "idle" | "running" | "completed" | "failed";
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastError: string | null;
  cardsSynced: number;
  cursor: string | null;
  metadata: Record<string, unknown>;
}

// ─── Lectura de estado ─────────────────────────────────────────────────────────

export async function getSyncState(
  provider: string,
  game: GameKey,
  syncType: SyncType
): Promise<SyncState | null> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("provider_sync_state")
      .select("*")
      .eq("provider", provider)
      .eq("game", game)
      .eq("sync_type", syncType)
      .maybeSingle();

    if (error) {
      logger.warn("[sync] getSyncState error:", error.message);
      return null;
    }
    if (!data) return null;

    return {
      id: data.id as string,
      provider: data.provider as string,
      game: data.game as GameKey,
      syncType: data.sync_type as SyncType,
      status: data.status as SyncState["status"],
      lastStartedAt: data.last_started_at as string | null,
      lastCompletedAt: data.last_completed_at as string | null,
      lastError: data.last_error as string | null,
      cardsSynced: (data.cards_synced as number) ?? 0,
      cursor: data.cursor as string | null,
      metadata: (data.metadata as Record<string, unknown>) ?? {},
    };
  } catch (err) {
    logger.warn("[sync] getSyncState exception:", err instanceof Error ? err.message : err);
    return null;
  }
}

// ─── Cambios de estado ────────────────────────────────────────────────────────

export async function markSyncRunning(
  provider: string,
  game: GameKey,
  syncType: SyncType
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from("provider_sync_state")
      .upsert(
        {
          provider,
          game,
          sync_type: syncType,
          status: "running",
          last_started_at: new Date().toISOString(),
          last_error: null,
        },
        { onConflict: "provider,game,sync_type" }
      );
  } catch (err) {
    logger.warn("[sync] markSyncRunning exception:", err instanceof Error ? err.message : err);
  }
}

export async function markSyncCompleted(
  provider: string,
  game: GameKey,
  syncType: SyncType,
  cardsSynced: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const updatePayload: Record<string, unknown> = {
      status: "completed",
      last_completed_at: new Date().toISOString(),
      cards_synced: cardsSynced,
      cursor: null, // cursor vacío — sync completado
    };
    if (metadata) updatePayload.metadata = metadata;

    await supabase
      .from("provider_sync_state")
      .update(updatePayload)
      .eq("provider", provider)
      .eq("game", game)
      .eq("sync_type", syncType);
  } catch (err) {
    logger.warn("[sync] markSyncCompleted exception:", err instanceof Error ? err.message : err);
  }
}

export async function markSyncFailed(
  provider: string,
  game: GameKey,
  syncType: SyncType,
  error: string,
  cursor?: string
): Promise<void> {
  try {
    const supabase = createAdminClient();
    const updatePayload: Record<string, unknown> = {
      status: "failed",
      last_error: error,
    };
    // Guardar cursor para reanudar en la próxima invocación
    if (cursor !== undefined) updatePayload.cursor = cursor;

    await supabase
      .from("provider_sync_state")
      .update(updatePayload)
      .eq("provider", provider)
      .eq("game", game)
      .eq("sync_type", syncType);
  } catch (err) {
    logger.warn("[sync] markSyncFailed exception:", err instanceof Error ? err.message : err);
  }
}

/** Actualiza el cursor sin cambiar el status — para checkpoints durante un sync largo. */
export async function updateSyncCursor(
  provider: string,
  game: GameKey,
  syncType: SyncType,
  cursor: string,
  cardsSynced: number
): Promise<void> {
  try {
    const supabase = createAdminClient();
    await supabase
      .from("provider_sync_state")
      .update({ cursor, cards_synced: cardsSynced })
      .eq("provider", provider)
      .eq("game", game)
      .eq("sync_type", syncType);
  } catch {
    // No crítico
  }
}

// ─── Lógica de anti-doble-ejecución ───────────────────────────────────────────

const STALE_RUNNING_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutos

/**
 * Devuelve true si el cron debería abortar (hay otra ejecución activa reciente).
 * Si la ejecución activa tiene más de 10 minutos, asume crash y deja pasar.
 */
export function shouldAbortSync(state: SyncState | null): boolean {
  if (!state) return false;
  if (state.status !== "running") return false;
  if (!state.lastStartedAt) return false;

  const elapsed = Date.now() - new Date(state.lastStartedAt).getTime();
  return elapsed < STALE_RUNNING_THRESHOLD_MS;
}
