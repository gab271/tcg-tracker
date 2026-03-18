/**
 * GET /api/pokemon-sets
 *
 * Devuelve todos los sets de Pokémon. Flujo DB-first:
 *   1. Redis cache (24h)
 *   2. tcg_sets table (DB local)
 *   3. PokémonTCG.io como fallback si la DB está vacía
 *      → guarda en tcg_sets para el próximo request
 */

import { NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/redis";
import { getSetsFromDB, upsertSets } from "@/lib/services/catalog.service";

const BASE_URL = "https://api.pokemontcg.io/v2";
const CACHE_KEY = "pokemon:sets:all";
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24h

export async function GET() {
  // 1. Redis cache
  const cached = await redisGet<{ sets: unknown[] }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // 2. DB-first: leer de tcg_sets
  const dbSets = await getSetsFromDB("pokemon");
  if (dbSets.length > 0) {
    // Normalizar al formato que espera el frontend (compatible con PokémonTCG.io raw)
    const result = {
      sets: dbSets.map((s) =>
        Object.keys(s.raw).length > 0
          ? s.raw  // usar el payload original del provider
          : {
              id: s.externalId,
              name: s.name,
              series: s.series,
              printedTotal: s.printedTotal,
              total: s.total,
              releaseDate: s.releaseDate,
              images: { symbol: s.symbolUrl, logo: s.logoUrl },
            }
      ),
    };
    await redisSet(CACHE_KEY, result, { ex: CACHE_TTL_SECONDS });
    return NextResponse.json(result, { headers: { "X-Cache": "DB" } });
  }

  // 3. Fallback: PokémonTCG.io
  try {
    const res = await fetch(`${BASE_URL}/sets?orderBy=-releaseDate`, {
      headers: process.env.POKEMONTCG_API_KEY
        ? { "X-Api-Key": process.env.POKEMONTCG_API_KEY }
        : {},
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json({ sets: [] }, { status: 200 });
    }

    const data = await res.json();
    const rawSets = data.data ?? [];
    const result = { sets: rawSets };

    // Guardar en DB (fire-and-forget)
    const providerSets = rawSets.map((s: Record<string, unknown>) => ({
      externalId: s.id as string,
      name: s.name as string,
      series: (s.series as string) ?? null,
      printedTotal: (s.printedTotal as number) ?? null,
      total: (s.total as number) ?? null,
      releaseDate: (s.releaseDate as string) ?? null,
      symbolUrl: ((s.images as Record<string, string>)?.symbol) ?? null,
      logoUrl: ((s.images as Record<string, string>)?.logo) ?? null,
      raw: s,
    }));
    upsertSets(providerSets, "pokemon").catch(() => {});

    await redisSet(CACHE_KEY, result, { ex: CACHE_TTL_SECONDS });
    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch {
    return NextResponse.json({ sets: [] }, { status: 200 });
  }
}
