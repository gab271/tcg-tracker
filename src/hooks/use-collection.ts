"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserCollection,
  addCardToCollection,
  removeCardFromCollection,
  updateCardQuantity,
} from "@/lib/supabase/queries/collection";
import type { AddCardInput } from "@/lib/validations/collection";
import { useAuth } from "./use-auth";

export function useCollection(game?: string) {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["collection", user?.id, game],
    queryFn: () => fetchUserCollection(supabase, user!.id, game),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

export function useAddCard() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: AddCardInput) => {
      if (!user) throw new Error("Not authenticated");
      return addCardToCollection(supabase, user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });
}

export function useRemoveCard() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (cardId: string) => removeCardFromCollection(supabase, cardId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection"] });
      queryClient.invalidateQueries({ queryKey: ["user-stats"] });
    },
  });
}

export function useUpdateCardQuantity() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ cardId, quantity }: { cardId: string; quantity: number }) =>
      updateCardQuantity(supabase, cardId, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collection"] });
    },
  });
}
