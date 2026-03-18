"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  fetchUserAlerts,
  createAlert,
  deleteAlert,
  toggleAlert,
  type CreateAlertInput,
} from "@/lib/supabase/queries/price-alerts";
import { useAuth } from "./use-auth";

export function usePriceAlerts() {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["price-alerts", user?.id],
    queryFn: () => fetchUserAlerts(supabase, user!.id),
    enabled: !!user,
    staleTime: 1000 * 60,
  });
}

export function useCreateAlert() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (input: CreateAlertInput) => {
      if (!user) throw new Error("Not authenticated");
      return createAlert(supabase, user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts", user?.id] });
    },
  });
}

export function useDeleteAlert() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (alertId: string) => {
      if (!user) throw new Error("Not authenticated");
      return deleteAlert(supabase, alertId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts", user?.id] });
    },
  });
}

export function useToggleAlert() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ alertId, isActive }: { alertId: string; isActive: boolean }) => {
      if (!user) throw new Error("Not authenticated");
      return toggleAlert(supabase, alertId, isActive, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-alerts", user?.id] });
    },
  });
}
