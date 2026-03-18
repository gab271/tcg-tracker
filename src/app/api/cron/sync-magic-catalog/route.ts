/**
 * POST /api/cron/sync-magic-catalog
 *
 * Sincroniza el catálogo de Magic: The Gathering desde el bulk data de Scryfall.
 * Scryfall publica un JSON único con todas las cartas, actualizado diariamente.
 * Se compara el download_uri con el último sync: si no cambió → skip.
 *
 * Llamado diariamente a las 04:00 UTC por Vercel Cron.
 * Auth: Bearer CRON_SECRET
 *
 * NOTA DE MEMORIA: el bulk JSON filtrado ocupa ~50k cartas.
 * Si falla por memoria en Vercel Hobby, reducir el filtro o migrar a plan Pro.
 */

import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/config";
import { MagicProvider } from "@/lib/tcg/providers/magic-provider";
import { upsertCards, upsertSets } from "@/lib/services/catalog.service";
import {
  getSyncState,
  markSyncRunning,
  markSyncCompleted,
  markSyncFailed,
  shouldAbortSync,
} from "@/lib/services/sync.service";

const PROVIDER = "scryfall";
const GAME = "magic" as const;

// Timeout generoso para la descarga del bulk (~300MB)
const BULK_DOWNLOAD_TIMEOUT_MS = 120_000;

async function getBulkDownloadUri(): Promise<{ uri: string; updatedAt: string } | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch("https://api.scryfall.com/bulk-data", {
      headers: { "User-Agent": "TCGTracker/1.0" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data: Array<{ type: string; download_uri: string; updated_at: string }>;
    };
    const obj = json.data.find((d) => d.type === "default_cards");
    if (!obj) return null;
    return { uri: obj.download_uri, updatedAt: obj.updated_at };
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!serverEnv.CRON_SECRET || authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const syncState = await getSyncState(PROVIDER, GAME, "full_catalog");

  if (shouldAbortSync(syncState)) {
    return NextResponse.json({
      skipped: true,
      reason: "Another sync is already running",
    });
  }

  // Obtener metadatos del bulk data
  const bulkMeta = await getBulkDownloadUri();
  if (!bulkMeta) {
    return NextResponse.json({ error: "Could not fetch Scryfall bulk-data metadata" }, { status: 502 });
  }

  // Comparar con el último sync: si mismo URI → skip (datos sin cambiar)
  const lastUri = syncState?.metadata?.last_bulk_uri as string | undefined;
  if (lastUri && lastUri === bulkMeta.uri) {
    return NextResponse.json({
      skipped: true,
      reason: "Bulk data has not changed since last sync",
      lastSyncedAt: syncState?.lastCompletedAt,
      bulkUpdatedAt: bulkMeta.updatedAt,
    });
  }

  await markSyncRunning(PROVIDER, GAME, "full_catalog");

  try {
    const provider = new MagicProvider();

    // getAllCards descarga el bulk, filtra, y devuelve todo en un BulkIngestPage
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BULK_DOWNLOAD_TIMEOUT_MS);

    let page;
    try {
      page = await provider.getAllCards();
    } finally {
      clearTimeout(timeout);
    }

    if (page.cards.length > 0) {
      await upsertCards(page.cards, GAME);
    }

    await markSyncCompleted(PROVIDER, GAME, "full_catalog", page.cards.length, {
      last_bulk_uri: bulkMeta.uri,
      bulk_updated_at: bulkMeta.updatedAt,
    });

    return NextResponse.json({
      completed: true,
      totalSynced: page.cards.length,
      bulkUri: bulkMeta.uri,
      message: `Magic catalog sync completed: ${page.cards.length} cards`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markSyncFailed(PROVIDER, GAME, "full_catalog", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET: sincronizar sets de Scryfall
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!serverEnv.CRON_SECRET || authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const provider = new MagicProvider();
  try {
    await markSyncRunning(PROVIDER, GAME, "sets");
    const sets = await provider.getSets();
    await upsertSets(sets, GAME);
    await markSyncCompleted(PROVIDER, GAME, "sets", sets.length);
    return NextResponse.json({ synced: sets.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await markSyncFailed(PROVIDER, GAME, "sets", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
