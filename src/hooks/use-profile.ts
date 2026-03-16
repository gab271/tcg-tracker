"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserProfile,
  fetchUserStats,
  updateDisplayName,
  uploadAvatar,
} from "@/lib/supabase/queries/profile";
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
