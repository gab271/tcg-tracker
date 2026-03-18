import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbTransaction } from "@/types/database";

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

