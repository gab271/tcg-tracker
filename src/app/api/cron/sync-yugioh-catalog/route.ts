/**
 * POST /api/cron/sync-yugioh-catalog
 *
 * Sincroniza el catálogo completo de Yu-Gi-Oh! desde YGOPRODeck.
 * Procesa PAGES_PER_RUN páginas de 500 cartas por invocación.
 * El cursor es el offset numérico.
 *
 * Llamado diariamente a las 05:00 UTC por Vercel Cron.
 * Auth: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/config";
import { YugiohProvider } from "@/lib/tcg/providers/yugioh-provider";
import { upsertCards } from "@/lib/services/catalog.service";
import {
  getSyncState,
  markSyncRunning,
  markSyncCompleted,
  markSyncFailed,
  updateSyncCursor,
  shouldAbortSync,
} from "@/lib/services/sync.service";

const PROVIDER = "ygoprodeck";
const GAME = "yugioh" as const;
const PAGES_PER_RUN = 10; // 10 × 500 = 5000 cartas por ejecución

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!serverEnv.CRON_SECRET || authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = new YugiohProvider();
  const syncState = await getSyncState(PROVIDER, GAME, "full_catalog");

  if (shouldAbortSync(syncState)) {
    return NextResponse.json({
      skipped: true,
      reason: "Another sync is already running",
    });
  }

  const startCursor = syncState?.status === "completed" ? "0" : (syncState?.cursor ?? "0");

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
          message: "Full Yu-Gi-Oh! catalog sync completed",
        });
      }

      currentCursor = page.nextCursor;
      await updateSyncCursor(PROVIDER, GAME, "full_catalog", currentCursor, totalSynced);
    }

    await updateSyncCursor(PROVIDER, GAME, "full_catalog", currentCursor, totalSynced);

    return NextResponse.json({
      completed: false,
      pagesProcessed,
      totalSynced,
      nextCursor: currentCursor,
      message: `Processed ${pagesProcessed} pages. Resume from cursor ${currentCursor}.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markSyncFailed(PROVIDER, GAME, "full_catalog", message, currentCursor);
    return NextResponse.json({ error: message, cursor: currentCursor }, { status: 500 });
  }
}
