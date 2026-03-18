"use client";

/**
 * Hook de set completion para Pokémon.
 *
 * Obtiene los sets disponibles de la PokémonTCG API y compara con la
 * colección del usuario para calcular el % de completitud de cada set.
 * Sólo se activa cuando activeGame === "Pokémon".
 */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
// Interfaz mínima que el hook necesita — compatible con DbCollection
interface CollectionItem {
  card_id: string;
  game: string;
}

interface PokemonSet {
  id: string;
  name: string;
  series: string;
  total: number;
  releaseDate: string;
  images: { symbol: string; logo: string };
}

interface SetCompletion {
  setId: string;
  setName: string;
  series: string;
  owned: number;
  total: number;
  pct: number;
  logoUrl: string;
}

async function fetchPokemonSets(): Promise<PokemonSet[]> {
  const res = await fetch("/api/pokemon-sets");
  if (!res.ok) return [];
  const data = await res.json();
  return data.sets ?? [];
}

export function useSetCompletion(collection: CollectionItem[], activeGame: string) {
  const enabled = activeGame === "Pokémon" || activeGame === "All";

  const { data: sets = [], isLoading } = useQuery({
    queryKey: ["pokemon-sets"],
    queryFn: fetchPokemonSets,
    enabled,
    staleTime: 1000 * 60 * 60 * 24, // 24h — los sets no cambian frecuentemente
  });

  const completion = useMemo((): SetCompletion[] => {
    if (!enabled || sets.length === 0) return [];

    const pokemonCards = collection.filter((c) => c.game === "Pokémon");
    if (pokemonCards.length === 0) return [];

    // Agrupar cartas por set_id (extraemos el set del card_id: "xy7-1" → "xy7")
    const ownedBySet: Record<string, Set<string>> = {};
    for (const card of pokemonCards) {
      const parts = card.card_id?.split("-");
      if (!parts || parts.length < 2) continue;
      const setId = parts.slice(0, -1).join("-"); // soporta IDs como "swsh12pt5-99"
      if (!ownedBySet[setId]) ownedBySet[setId] = new Set();
      ownedBySet[setId].add(card.card_id);
    }

    return sets
      .filter((s) => ownedBySet[s.id] && ownedBySet[s.id].size > 0)
      .map((s) => ({
        setId: s.id,
        setName: s.name,
        series: s.series,
        owned: ownedBySet[s.id]?.size ?? 0,
        total: s.total,
        pct: Math.round(((ownedBySet[s.id]?.size ?? 0) / s.total) * 100),
        logoUrl: s.images.symbol,
      }))
      .sort((a, b) => b.pct - a.pct);
  }, [sets, collection, enabled]);

  return { completion, isLoading: enabled && isLoading };
}
