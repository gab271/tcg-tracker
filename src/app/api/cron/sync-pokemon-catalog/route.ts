/**
 * POST /api/cron/sync-pokemon-catalog
 *
 * Sincroniza el catálogo completo de PokémonTCG.io a la tabla tcg_cards.
 * Procesa PAGES_PER_RUN páginas por invocación (2500 cartas) y guarda el cursor
 * en provider_sync_state para reanudar en la siguiente ejecución.
 *
 * Llamado diariamente a las 03:00 UTC por Vercel Cron.
 * También puede ejecutarse manualmente para poblar el catálogo inicial.
 * Auth: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/config";
import { PokemonProvider } from "@/lib/tcg/providers/pokemon-provider";
import { upsertCards, upsertSets } from "@/lib/services/catalog.service";
import {
  getSyncState,
  markSyncRunning,
  markSyncCompleted,
  markSyncFailed,
  updateSyncCursor,
  shouldAbortSync,
} from "@/lib/services/sync.service";

const PROVIDER = "pokemontcg";
const GAME = "pokemon" as const;
const PAGES_PER_RUN = 10; // 10 páginas × 250 cartas = 2500 cartas por ejecución

export async function POST(req: NextRequest) {
  // Validar CRON_SECRET
  const authHeader = req.headers.get("authorization");
  if (!serverEnv.CRON_SECRET || authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = new PokemonProvider();

  // Leer estado actual del sync
  const syncState = await getSyncState(PROVIDER, GAME, "full_catalog");

  // Anti-doble-ejecución: abortar si hay otra ejecución activa en los últimos 10 minutos
  if (shouldAbortSync(syncState)) {
    return NextResponse.json({
      skipped: true,
      reason: "Another sync is already running",
      lastStartedAt: syncState?.lastStartedAt,
    });
  }

  // Si el sync anterior se completó (cursor null), empezar de nuevo desde página 1
  const startCursor = syncState?.status === "completed" ? "1" : (syncState?.cursor ?? "1");

  await markSyncRunning(PROVIDER, GAME, "full_catalog");

  let currentCursor = startCursor;
  let totalSynced = syncState?.cardsSynced ?? 0;
  let pagesProcessed = 0;

  try {
    while (pagesProcessed < PAGES_PER_RUN) {
      const page = await provider.getAllCards({ cursor: currentCursor });

      if (page.cards.length > 0) {
        await upsertCards(page.cards, GAME);
        totalSynced += page.cards.length;
        pagesProcessed++;
      }

      if (page.nextCursor === null) {
        // Catálogo completo sincronizado
        await markSyncCompleted(PROVIDER, GAME, "full_catalog", totalSynced);
        return NextResponse.json({
          completed: true,
          pagesProcessed,
          totalSynced,
          message: "Full Pokémon catalog sync completed",
        });
      }

      currentCursor = page.nextCursor;

      // Guardar checkpoint en caso de timeout a mitad del run
      await updateSyncCursor(PROVIDER, GAME, "full_catalog", currentCursor, totalSynced);
    }

    // Llegamos al límite de páginas por run — guardar cursor para la próxima invocación
    await updateSyncCursor(PROVIDER, GAME, "full_catalog", currentCursor, totalSynced);

    return NextResponse.json({
      completed: false,
      pagesProcessed,
      totalSynced,
      nextCursor: currentCursor,
      message: `Processed ${pagesProcessed} pages. Resume next run from cursor ${currentCursor}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markSyncFailed(PROVIDER, GAME, "full_catalog", message, currentCursor);
    return NextResponse.json({ error: message, cursor: currentCursor }, { status: 500 });
  }
}

// También sincronizar sets cuando se llame al endpoint
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!serverEnv.CRON_SECRET || authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = new PokemonProvider();

  try {
    await markSyncRunning(PROVIDER, GAME, "sets");
    const sets = await provider.getSets();
    await upsertSets(sets, GAME);
    await markSyncCompleted(PROVIDER, GAME, "sets", sets.length);

    return NextResponse.json({
      synced: sets.length,
      message: `Synced ${sets.length} Pokémon sets`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markSyncFailed(PROVIDER, GAME, "sets", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
