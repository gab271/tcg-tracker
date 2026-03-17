import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbTransaction, DbOffer } from "@/types/database";

// ── Transactions ──────────────────────────────────────────────────────────────

export async function fetchUserTransactions(
  supabase: SupabaseClient,
  userId: string
): Promise<DbTransaction[]> {
  const { data, error } = await supabase
    .from("market_transactions")
    .select("*")
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchTransactionById(
  supabase: SupabaseClient,
  id: string
): Promise<DbTransaction | null> {
  const { data, error } = await supabase
    .from("market_transactions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data;
}

export async function updateTransactionStatus(
  supabase: SupabaseClient,
  transactionId: string,
  status: DbTransaction["status"],
  notes?: string
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (notes !== undefined) update.notes = notes;

  const { error } = await supabase
    .from("market_transactions")
    .update(update)
    .eq("id", transactionId);

  if (error) throw error;
}

// ── Offers ────────────────────────────────────────────────────────────────────

export interface CreateOfferInput {
  listingId: string;
  sellerId: string;
  buyerUsername: string | null;
  offeredPrice: number;
  message?: string;
}

export async function createOffer(
  supabase: SupabaseClient,
  buyerId: string,
  input: CreateOfferInput
): Promise<DbOffer> {
  const { data, error } = await supabase
    .from("market_offers")
    .insert({
      listing_id: input.listingId,
      buyer_id: buyerId,
      seller_id: input.sellerId,
      buyer_username: input.buyerUsername,
      offered_price: input.offeredPrice,
      message: input.message ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchOffersForListing(
  supabase: SupabaseClient,
  listingId: string
): Promise<DbOffer[]> {
  const { data, error } = await supabase
    .from("market_offers")
    .select("*")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchMyOffers(
  supabase: SupabaseClient,
  userId: string
): Promise<DbOffer[]> {
  const { data, error } = await supabase
    .from("market_offers")
    .select("*")
    .eq("buyer_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function withdrawOffer(
  supabase: SupabaseClient,
  offerId: string
): Promise<void> {
  const { error } = await supabase
    .from("market_offers")
    .update({ status: "withdrawn" })
    .eq("id", offerId);

  if (error) throw error;
}
