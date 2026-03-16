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

export async function deleteCardsBatch(
  supabase: SupabaseClient,
  ids: string[]
): Promise<void> {
  const { error } = await supabase.from("collections").delete().in("id", ids);
  if (error) throw error;
}

export async function addCollectionCardsToDeck(
  supabase: SupabaseClient,
  deckId: string,
  cards: { cardId: string; name: string; image: string | null; price: number }[]
): Promise<{ added: number; skipped: number }> {
  const [{ data: existing }, { data: lastCard }] = await Promise.all([
    supabase.from("deck_cards").select("card_id").eq("deck_id", deckId),
    supabase
      .from("deck_cards")
      .select("order_index")
      .eq("deck_id", deckId)
      .order("order_index", { ascending: false })
      .limit(1),
  ]);

  const existingIds = new Set(
    (existing ?? []).map((c: { card_id: string }) => c.card_id)
  );
  const maxOrder =
    (lastCard?.[0] as { order_index: number } | undefined)?.order_index ?? -1;

  const newCards = cards.filter((c) => !existingIds.has(c.cardId));
  if (newCards.length === 0) return { added: 0, skipped: cards.length };

  const rows = newCards.map((c, i) => ({
    deck_id: deckId,
    card_id: c.cardId,
    name: c.name,
    image_url: c.image,
    price: c.price,
    quantity: 1,
    order_index: maxOrder + 1 + i,
  }));

  const { error } = await supabase.from("deck_cards").insert(rows);
  if (error) throw error;
  return { added: newCards.length, skipped: cards.length - newCards.length };
}

export async function importCollectionBatch(
  supabase: SupabaseClient,
  userId: string,
  cards: AddCardInput[]
): Promise<{ imported: number }> {
  if (cards.length === 0) return { imported: 0 };

  const rows = cards.map((c) => ({
    user_id: userId,
    card_id: c.cardId,
    card_name: c.name,
    card_image: c.image ?? null,
    game: c.game,
    rarity: c.rarity,
    price: c.price,
    quantity: c.quantity,
  }));

  const { error } = await supabase
    .from("collections")
    .upsert(rows, { onConflict: "user_id,card_id" });
  if (error) throw error;
  return { imported: rows.length };
}
