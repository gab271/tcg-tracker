import type { SupabaseClient } from "@supabase/supabase-js";
import type { AddCardInput } from "@/lib/validations/collection";

export interface CollectionRow {
  id: string;
  user_id: string;
  card_id: string;
  card_name: string;
  card_image: string | null;
  game: string;
  rarity: string;
  price: number;
  quantity: number;
  created_at: string;
}

export async function fetchUserCollection(
  supabase: SupabaseClient,
  userId: string,
  game?: string
): Promise<CollectionRow[]> {
  let query = supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (game) {
    query = query.eq("game", game);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function addCardToCollection(
  supabase: SupabaseClient,
  userId: string,
  input: AddCardInput
): Promise<CollectionRow> {
  const { data, error } = await supabase
    .from("collections")
    .upsert(
      {
        user_id: userId,
        card_id: input.cardId,
        card_name: input.name,
        card_image: input.image ?? null,
        game: input.game,
        rarity: input.rarity,
        price: input.price,
        quantity: input.quantity,
      },
      { onConflict: "user_id,card_id" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeCardFromCollection(
  supabase: SupabaseClient,
  cardId: string
): Promise<void> {
  const { error } = await supabase.from("collections").delete().eq("id", cardId);
  if (error) throw error;
}

export async function updateCardQuantity(
  supabase: SupabaseClient,
  cardId: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase
    .from("collections")
    .update({ quantity })
    .eq("id", cardId);
  if (error) throw error;
}
