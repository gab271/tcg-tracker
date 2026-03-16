"use client";

import { useQuery } from "@tanstack/react-query";
import type { CardPriceResponse } from "@/types/api";

async function fetchCardPrice(cardId: string, game: string): Promise<CardPriceResponse> {
  const res = await fetch(
    `/api/card-price?cardId=${encodeURIComponent(cardId)}&game=${encodeURIComponent(game)}`
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to fetch card price");
  }
  return res.json();
}

export function useCardPrice(cardId: string, game: string) {
  return useQuery({
    queryKey: ["card-price", cardId, game],
    queryFn: () => fetchCardPrice(cardId, game),
    enabled: !!cardId && !!game,
    staleTime: 1000 * 60 * 10, // 10 minutes (server caches for 1 hour)
  });
}
