"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchActiveListings,
  fetchListingById,
  fetchSellerListings,
  createListing,
  cancelListing,
  type MarketFilters,
  type CreateListingInput,
} from "@/lib/supabase/queries/market";
import { useAuth } from "./use-auth";

export function useMarketListings(filters: MarketFilters = {}) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["market-listings", filters],
    queryFn: () => fetchActiveListings(supabase, filters),
    staleTime: 1000 * 30, // 30s — market data refreshes more often
  });
}

export function useMarketListing(id: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["market-listing", id],
    queryFn: () => fetchListingById(supabase, id),
    enabled: !!id,
  });
}

export function useMyListings() {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-listings", user?.id],
    queryFn: () => fetchSellerListings(supabase, user!.id),
    enabled: !!user,
  });
}

export function useCreateListing() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: Omit<CreateListingInput, "sellerId">) => {
      if (!user) throw new Error("Not authenticated");
      return createListing(supabase, { ...input, sellerId: user.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}

export function useCancelListing() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => cancelListing(supabase, listingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    },
  });
}
