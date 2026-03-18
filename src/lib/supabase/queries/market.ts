import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbMarketListing } from "@/types/database";

export interface MarketFilters {
  game?: string;
  condition?: string;
  rarity?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CreateListingInput {
  sellerId: string;
  sellerUsername: string | null;
  sellerAvatar: string | null;
  collectionItemId?: string;
  cardId: string;
  cardName: string;
  cardImage?: string;
  game: string;
  rarity?: string;
  condition: string;
  price: number;
  photos?: string[]; // URLs de fotos subidas a Supabase Storage
}

export async function fetchActiveListings(
  supabase: SupabaseClient,
  filters: MarketFilters = {}
): Promise<DbMarketListing[]> {
  let query = supabase
    .from("market_listings")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (filters.game) query = query.eq("game", filters.game);
  if (filters.condition) query = query.eq("condition", filters.condition);
  if (filters.rarity) query = query.eq("rarity", filters.rarity);
  if (filters.minPrice !== undefined) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice !== undefined) query = query.lte("price", filters.maxPrice);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function fetchListingById(
  supabase: SupabaseClient,
  id: string
): Promise<DbMarketListing | null> {
  const { data, error } = await supabase
    .from("market_listings")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function fetchSellerListings(
  supabase: SupabaseClient,
  sellerId: string
): Promise<DbMarketListing[]> {
  const { data, error } = await supabase
    .from("market_listings")
    .select("*")
    .eq("seller_id", sellerId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createListing(
  supabase: SupabaseClient,
  input: CreateListingInput
): Promise<DbMarketListing> {
  const { data, error } = await supabase
    .from("market_listings")
    .insert({
      seller_id: input.sellerId,
      seller_username: input.sellerUsername,
      seller_avatar: input.sellerAvatar,
      collection_item_id: input.collectionItemId ?? null,
      card_id: input.cardId,
      card_name: input.cardName,
      card_image: input.cardImage ?? null,
      game: input.game,
      rarity: input.rarity ?? null,
      condition: input.condition,
      price: input.price,
      status: "active",
      photos: input.photos ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelListing(
  supabase: SupabaseClient,
  listingId: string
): Promise<void> {
  const { error } = await supabase
    .from("market_listings")
    .update({ status: "cancelled" })
    .eq("id", listingId);

  if (error) throw error;
}
