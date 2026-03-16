import type { SupabaseClient } from "@supabase/supabase-js";
import type { CreateDeckInput } from "@/lib/validations/deck";

export interface DeckRow {
  id: string;
  user_id: string;
  name: string;
  game: string;
  cover_card_id: string | null;
  description?: string;
  format?: string;
  created_at: string;
  updated_at: string;
  deck_cards?: { id: string; quantity: number; card_id: string; price?: number }[];
}

export async function fetchUserDecks(supabase: SupabaseClient): Promise<DeckRow[]> {
  const { data, error } = await supabase
    .from("decks")
    .select(`*, deck_cards(id, quantity, card_id, price)`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchDeckById(supabase: SupabaseClient, deckId: string): Promise<DeckRow> {
  const { data, error } = await supabase
    .from("decks")
    .select("*")
    .eq("id", deckId)
    .single();

  if (error) throw error;
  return data;
}

export interface DeckCardRow {
  id: string;
  deck_id: string;
  card_id: string;
  name: string;
  image_url: string | null;
  price: number;
  quantity: number;
  order_index: number;
  created_at: string;
}

export async function fetchDeckCards(supabase: SupabaseClient, deckId: string): Promise<DeckCardRow[]> {
  const { data, error } = await supabase
    .from("deck_cards")
    .select("*")
    .eq("deck_id", deckId)
    .order("order_index", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createDeck(
  supabase: SupabaseClient,
  userId: string,
  input: CreateDeckInput
): Promise<DeckRow> {
  const { data, error } = await supabase
    .from("decks")
    .insert([{ ...input, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteDeck(supabase: SupabaseClient, deckId: string): Promise<void> {
  const { error } = await supabase.from("decks").delete().eq("id", deckId);
  if (error) throw error;
}

export async function updateDeckCardOrder(
  supabase: SupabaseClient,
  updates: { id: string; order_index: number }[]
): Promise<void> {
  // Batch update using Promise.all
  const results = await Promise.all(
    updates.map(({ id, order_index }) =>
      supabase.from("deck_cards").update({ order_index }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function updateDeckCardQuantity(
  supabase: SupabaseClient,
  cardId: string,
  quantity: number
): Promise<void> {
  const { error } = await supabase
    .from("deck_cards")
    .update({ quantity })
    .eq("id", cardId);
  if (error) throw error;
}

export async function deleteDeckCard(supabase: SupabaseClient, cardId: string): Promise<void> {
  const { error } = await supabase.from("deck_cards").delete().eq("id", cardId);
  if (error) throw error;
}
