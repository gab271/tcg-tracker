"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { CardSearchResult } from "@/types/domain";

async function searchCards(query: string): Promise<CardSearchResult[]> {
  const encoded = encodeURIComponent(`name:"*${query}*"`);
  const res = await fetch(`https://api.pokemontcg.io/v2/cards?q=${encoded}&pageSize=20`);
  if (!res.ok) return [];

  const data = await res.json();
  if (!data?.data) return [];

  return data.data.map((card: {
    id: string;
    name: string;
    images: { small: string };
    rarity?: string;
    cardmarket?: { prices?: { averageSellPrice?: number } };
  }) => ({
    id: card.id,
    name: card.name,
    image: card.images.small,
    game: "Pokemon",
    rarity: card.rarity ?? "Common",
    price: card.cardmarket?.prices?.averageSellPrice ?? 0,
  }));
}

/** Debounced card search hook. Only fires after 500ms of no typing and min 2 chars. */
export function useCardSearch(searchTerm: string) {
  const [debouncedTerm, setDebouncedTerm] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  return useQuery({
    queryKey: ["card-search", debouncedTerm],
    queryFn: () => searchCards(debouncedTerm),
    enabled: debouncedTerm.length >= 2,
    staleTime: 1000 * 60 * 5,
  });
}
