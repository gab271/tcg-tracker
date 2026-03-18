import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbPriceAlert } from "@/types/database";

export interface CreateAlertInput {
  cardId: string;
  cardName: string;
  cardImage?: string;
  game: string;
  targetPrice: number;
  direction?: "below" | "above";
}

export async function fetchUserAlerts(
  supabase: SupabaseClient,
  userId: string
): Promise<DbPriceAlert[]> {
  const { data, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createAlert(
  supabase: SupabaseClient,
  userId: string,
  input: CreateAlertInput
): Promise<DbPriceAlert> {
  const { data, error } = await supabase
    .from("price_alerts")
    .insert({
      user_id: userId,
      card_id: input.cardId,
      card_name: input.cardName,
      card_image: input.cardImage ?? null,
      game: input.game,
      target_price: input.targetPrice,
      direction: input.direction ?? "below",
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAlert(
  supabase: SupabaseClient,
  alertId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("price_alerts")
    .delete()
    .eq("id", alertId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function toggleAlert(
  supabase: SupabaseClient,
  alertId: string,
  isActive: boolean,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("price_alerts")
    .update({ is_active: isActive })
    .eq("id", alertId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function fetchAllActiveAlertsAdmin(
  supabase: SupabaseClient
): Promise<DbPriceAlert[]> {
  // Used by the edge function (service role) — bypasses RLS
  const { data, error } = await supabase
    .from("price_alerts")
    .select("*")
    .eq("is_active", true);

  if (error) throw error;
  return data ?? [];
}
