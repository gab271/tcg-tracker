import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbWishlistItem } from "@/types/database";

export interface AddToWishlistInput {
  cardId: string;
  cardName: string;
  cardImage?: string;
  game: string;
  maxPrice?: number;
}

export async function fetchWishlist(
  supabase: SupabaseClient,
  userId: string
): Promise<DbWishlistItem[]> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function addToWishlist(
  supabase: SupabaseClient,
  userId: string,
  input: AddToWishlistInput
): Promise<DbWishlistItem> {
  const { data, error } = await supabase
    .from("wishlists")
    .upsert(
      {
        user_id: userId,
        card_id: input.cardId,
        card_name: input.cardName,
        card_image: input.cardImage ?? null,
        game: input.game,
        max_price: input.maxPrice ?? null,
      },
      { onConflict: "user_id,card_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeFromWishlist(
  supabase: SupabaseClient,
  wishlistItemId: string,
  userId: string
): Promise<void> {
  const { error } = await supabase
    .from("wishlists")
    .delete()
    .eq("id", wishlistItemId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function checkInWishlist(
  supabase: SupabaseClient,
  userId: string,
  cardId: string
): Promise<DbWishlistItem | null> {
  const { data, error } = await supabase
    .from("wishlists")
    .select("*")
    .eq("user_id", userId)
    .eq("card_id", cardId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function updateWishlistMaxPrice(
  supabase: SupabaseClient,
  itemId: string,
  maxPrice: number | null
): Promise<void> {
  const { error } = await supabase
    .from("wishlists")
    .update({ max_price: maxPrice })
    .eq("id", itemId);

  if (error) throw error;
}
