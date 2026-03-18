/**
 * GET /api/pokemon-sets
 *
 * Devuelve todos los sets de PokémonTCG.io.
 * Se cachea 24h en Redis (los sets no cambian frecuentemente).
 */

import { NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/redis";

const BASE_URL = "https://api.pokemontcg.io/v2";
const CACHE_KEY = "pokemon:sets:all";

export async function GET() {
  // 1. Redis cache
  const cached = await redisGet<{ sets: unknown[] }>(CACHE_KEY);
  if (cached) {
    return NextResponse.json(cached, { headers: { "X-Cache": "HIT" } });
  }

  // 2. Live API
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
    const result = { sets: data.data ?? [] };

    await redisSet(CACHE_KEY, result, { ex: 60 * 60 * 24 }); // 24h
    return NextResponse.json(result, { headers: { "X-Cache": "MISS" } });
  } catch {
    return NextResponse.json({ sets: [] }, { status: 200 });
  }
}
