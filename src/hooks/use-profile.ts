"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserProfile,
  fetchUserStats,
  updateDisplayName,
  uploadAvatar,
} from "@/lib/supabase/queries/profile";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import { useAuth } from "./use-auth";

export function useProfile() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile"],
    queryFn: () => fetchUserProfile(supabase),
    staleTime: 1000 * 60 * 5,
  });
}

export function useUserStats() {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: () => fetchUserStats(supabase, user!.id),
    enabled: !!user,
    staleTime: 1000 * 60 * 2,
  });
}

export function usePlanLimits() {
  const { data: profile } = useProfile();
  const { data: stats } = useUserStats();

  const plan = (profile?.plan ?? "FREE") as "FREE" | "PRO";
  const limits = PLAN_LIMITS[plan];

  const usage = {
    cards: stats?.totalCards ?? 0,
    decks: stats?.deckCount ?? 0,
    listings: stats?.listingCount ?? 0,
  };

  return {
    plan,
    limits,
    usage,
    canAddCard: plan === "PRO" || usage.cards < limits.maxCards,
    canAddDeck: plan === "PRO" || usage.decks < limits.maxDecks,
    canAddListing: plan === "PRO" || usage.listings < limits.maxListings,
    isAtCardLimit: plan === "FREE" && usage.cards >= limits.maxCards,
    isAtDeckLimit: plan === "FREE" && usage.decks >= limits.maxDecks,
    isAtListingLimit: plan === "FREE" && usage.listings >= limits.maxListings,
  };
}

export function useUpdateDisplayName() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (displayName: string) => updateDisplayName(supabase, displayName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

export function useUploadAvatar() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (file: File) => {
      if (!user) throw new Error("Not authenticated");
      return uploadAvatar(supabase, user.id, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}
