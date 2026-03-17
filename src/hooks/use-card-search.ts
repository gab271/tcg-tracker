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
  if (!res.ok) return [];

  const data = await res.json();
  if (!data?.cards) return [];

  return (
    data.cards as Array<{
      id: string;
      name: string;
      imageUrl: string;
      rarity?: string;
    }>
  ).map((card) => ({
    id: card.id,
    name: card.name,
    image: card.imageUrl,
    game,
    rarity: card.rarity ?? "Common",
    price: 0, // price is fetched separately via useCardPrice
  }));
}

/** Debounced card search hook. Only fires after 500ms of no typing and min 2 chars. */
export function useCardSearch(searchTerm: string, game = "pokemon") {
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return useQuery({
    queryKey: ["card-search", game, debouncedTerm],
    queryFn: () => searchCards(debouncedTerm, game),
    enabled: debouncedTerm.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
