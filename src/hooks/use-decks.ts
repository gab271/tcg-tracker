"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserDecks,
  fetchDeckById,
  fetchDeckCards,
  createDeck,
  deleteDeck,
  updateDeckCardOrder,
  updateDeckCardQuantity,
  deleteDeckCard,
} from "@/lib/supabase/queries/decks";
import type { CreateDeckInput } from "@/lib/validations/deck";
import { mapSupabaseError } from "@/lib/errors";
import { useAuth } from "./use-auth";

export function useDecks() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["decks"],
    queryFn: () => fetchUserDecks(supabase),
    staleTime: 1000 * 60 * 2,
  });
}

export function useDeck(deckId: string) {
  const supabase = createClient();

  const deck = useQuery({
    queryKey: ["deck", deckId],
    queryFn: () => fetchDeckById(supabase, deckId),
    enabled: !!deckId,
  });

  const cards = useQuery({
    queryKey: ["deck-cards", deckId],
    queryFn: () => fetchDeckCards(supabase, deckId),
    enabled: !!deckId,
  });

  return { deck, cards };
}

export function useCreateDeck() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateDeckInput) => {
      if (!user) throw new Error("Not authenticated");
      return createDeck(supabase, user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
    onError: (error) => mapSupabaseError(error),
  });
}

export function useDeleteDeck() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deckId: string) => deleteDeck(supabase, deckId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });
}

export function useUpdateCardOrder() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: { id: string; order_index: number }[]) =>
      updateDeckCardOrder(supabase, updates),
    onSuccess: (_data, _vars) => {
      queryClient.invalidateQueries({ queryKey: ["deck-cards"] });
    },
  });
}

export function useUpdateCardQuantity() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, quantity }: { cardId: string; quantity: number }) =>
      updateDeckCardQuantity(supabase, cardId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deck-cards"] });
      queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });
}

export function useDeleteDeckCard() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => deleteDeckCard(supabase, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deck-cards"] });
      queryClient.invalidateQueries({ queryKey: ["decks"] });
    },
  });
}
