"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { CardSearchResult } from "@/types/domain";

/**
 * Calls /api/cards which proxies PokemonTCG.io or Scryfall depending on the game.
 * Defaults to "pokemon" for backward compatibility.
 */
async function searchCards(
  query: string,
  game = "pokemon"
): Promise<CardSearchResult[]> {
  const params = new URLSearchParams({ game, q: query, pageSize: "20" });
  const res = await fetch(`/api/cards?${params}`);

  // Throw on error so React Query can retry automatically
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(body.error ?? `Search failed (${res.status})`);
  }

  const data = await res.json();
  if (!data?.cards) return [];

  return (
    data.cards as Array<{
      id: string;
      name: string;
      imageUrl: string;
      rarity?: string;
      price?: number | null;
    }>
  ).map((card) => ({
    id: card.id,
    name: card.name,
    image: card.imageUrl,
    game,
    rarity: card.rarity ?? "Common",
    price: card.price ?? 0,
  }));
}

/**
 * Debounced card search hook.
 * - Fires after 500ms of no typing and min 2 chars.
 * - Pass `featuredQuery` to load default cards when searchTerm is empty.
 */
export function useCardSearch(
  searchTerm: string,
  game = "pokemon",
  options?: { featuredQuery?: string }
) {
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Use featuredQuery as fallback when search is empty
  const effectiveTerm = debouncedTerm || options?.featuredQuery || "";

  return useQuery({
    queryKey: ["card-search", game, effectiveTerm],
    queryFn: () => searchCards(effectiveTerm, game),
    enabled: effectiveTerm.length >= 2,
    staleTime: 1000 * 60 * 5,
    retry: 2,
    retryDelay: (attempt) => attempt * 1500,
  });
}
