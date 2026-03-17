"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserTransactions,
  updateTransactionStatus,
  fetchMyOffers,
  fetchOffersForListing,
  withdrawOffer,
} from "@/lib/supabase/queries/transactions";
import { useAuth } from "./use-auth";
import type { DbTransaction } from "@/types/database";

export function useMyTransactions() {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-transactions", user?.id],
    queryFn: () => fetchUserTransactions(supabase, user!.id),
    enabled: !!user,
  });
}

export function useMyOffers() {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-offers", user?.id],
    queryFn: () => fetchMyOffers(supabase, user!.id),
    enabled: !!user,
  });
}

export function useListingOffers(listingId: string, enabled = true) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["listing-offers", listingId],
    queryFn: () => fetchOffersForListing(supabase, listingId),
    enabled: !!listingId && enabled,
    staleTime: 1000 * 15,
  });
}

export function useBuyNow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      listingId,
    }: {
      listingId: string;
    }): Promise<string> => {
      if (!user) throw new Error("Not authenticated");

      const res = await fetch("/api/market/buy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Purchase failed");
      return json.transactionId as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["market-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
  });
}

export function useMakeOffer() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      listingId,
      sellerId,
      offeredPrice,
      message,
    }: {
      listingId: string;
      sellerId: string;
      offeredPrice: number;
      message?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const res = await fetch("/api/market/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId, sellerId, offeredPrice, message }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Offer failed");
      return json;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["listing-offers", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
    },
  });
}

export function useAcceptOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId }: { offerId: string; listingId: string }) => {
      const res = await fetch(`/api/market/offer/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "accept" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      return json;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["market-listings"] });
      queryClient.invalidateQueries({ queryKey: ["my-listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing-offers", variables.listingId] });
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
  });
}

export function useRejectOffer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ offerId }: { offerId: string; listingId: string }) => {
      const res = await fetch(`/api/market/offer/${offerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      return json;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["listing-offers", variables.listingId],
      });
    },
  });
}

export function useWithdrawOffer() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => withdrawOffer(supabase, offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-offers"] });
    },
  });
}

export function useUpdateTransactionStatus() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      transactionId,
      status,
      notes,
    }: {
      transactionId: string;
      status: DbTransaction["status"];
      notes?: string;
    }) => updateTransactionStatus(supabase, transactionId, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-transactions"] });
    },
  });
}
