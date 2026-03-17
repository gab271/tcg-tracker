"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
  updateWishlistMaxPrice,
  type AddToWishlistInput,
} from "@/lib/supabase/queries/wishlist";
import { useAuth } from "./use-auth";

export function useWishlist() {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: () => fetchWishlist(supabase, user!.id),
    enabled: !!user,
    staleTime: 1000 * 60,
  });
}

export function useIsWishlisted(cardId: string) {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wishlist-check", user?.id, cardId],
    queryFn: () => checkInWishlist(supabase, user!.id, cardId),
    enabled: !!user && !!cardId,
    staleTime: 1000 * 60,
  });
}

export function useAddToWishlist() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: AddToWishlistInput) => {
      if (!user) throw new Error("Not authenticated");
      return addToWishlist(supabase, user.id, input);
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["wishlist-check", user?.id, input.cardId],
      });
    },
  });
}

export function useRemoveFromWishlist() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ itemId }: { itemId: string; cardId: string }) =>
      removeFromWishlist(supabase, itemId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
      queryClient.invalidateQueries({
        queryKey: ["wishlist-check", user?.id, variables.cardId],
      });
    },
  });
}

export function useUpdateWishlistMaxPrice() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ itemId, maxPrice }: { itemId: string; maxPrice: number | null }) =>
      updateWishlistMaxPrice(supabase, itemId, maxPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist", user?.id] });
    },
  });
}
