import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbPriceCache } from "@/types/database";

export async function getCachedPrice(
  supabase: SupabaseClient,
  cardId: string,
  game: string
): Promise<DbPriceCache | null> {
  const { data, error } = await supabase
    .from("price_cache")
    .select("*")
    .eq("card_id", cardId)
    .eq("game", game)
    .single();

  if (error || !data) return null;
  return data as DbPriceCache;
}

export async function upsertPriceCache(
  supabase: SupabaseClient,
  data: {
    card_id: string;
    game: string;
    card_name: string | null;
    current_price: number | null;
    price_history: { date: string; price: number }[];
    source: string | null;
    image_url: string | null;
  }
): Promise<void> {
  const { error } = await supabase.from("price_cache").upsert(
    { ...data, cached_at: new Date().toISOString() },
    { onConflict: "card_id,game" }
  );
  if (error) throw error;
}
