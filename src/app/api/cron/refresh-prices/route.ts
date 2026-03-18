/**
 * POST /api/cron/refresh-prices
 *
 * Refresca los precios de las cartas accedidas más recientemente.
 * Para cada juego: lee hasta 200 external_ids desde card_access_log,
 * fetcha precios del provider y los persiste en card_prices + price_history.
 *
 * Llamado cada hora por Vercel Cron.
 * Auth: Bearer CRON_SECRET
 */

import { NextRequest, NextResponse } from "next/server";
import { serverEnv } from "@/lib/config";
import { getProvider } from "@/lib/tcg/registry";
import { upsertPrices, recordPriceHistory, getRecentlyAccessedCardIds } from "@/lib/services/price.service";
import { logger } from "@/lib/logger";
import type { GameKey } from "@/lib/tcg/types";

const GAMES_WITH_PRICES: GameKey[] = ["pokemon", "magic", "yugioh"];
const CARDS_PER_GAME = 200;

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!serverEnv.CRON_SECRET || authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const summary: Record<string, { refreshed: number; errors: number }> = {};

  for (const game of GAMES_WITH_PRICES) {
    summary[game] = { refreshed: 0, errors: 0 };

    try {
      // Obtener las cartas accedidas más recientemente para este juego
      const externalIds = await getRecentlyAccessedCardIds(game, CARDS_PER_GAME);
      if (externalIds.length === 0) continue;

      const provider = getProvider(game);

      // Fetch precios del provider (en batch cuando es posible)
      const priceResults = await provider.getCardPrices(externalIds);

      if (priceResults.length === 0) continue;

      // Persistir en card_prices
      await upsertPrices(priceResults);

      // Guardar snapshot diario en price_history
      for (const p of priceResults) {
        if (p.price !== null) {
          await recordPriceHistory(p.externalId, p.game, p.currency, p.price, p.source);
        }
      }

      summary[game].refreshed = priceResults.length;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.warn(`[refresh-prices] Error refreshing ${game}:`, message);
      summary[game].errors++;
    }
  }

  return NextResponse.json({
    success: true,
    summary,
    refreshedAt: new Date().toISOString(),
  });
}
