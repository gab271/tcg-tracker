import type { SupabaseClient } from "@supabase/supabase-js";
import type { DbCollection } from "@/types/database";
import type { DeckRow } from "./decks";

export interface UserProfileRow {
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isPublicCollection: boolean;
  isPublicDecks: boolean;
  createdAt: string;
}

export async function fetchProfileByUsername(
  supabase: SupabaseClient,
  username: string
): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("username", username.toLowerCase())
    .maybeSingle();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    username: data.username,
    displayName: data.display_name ?? null,
    avatarUrl: data.avatar_url ?? null,
    isPublicCollection: data.is_public_collection,
    isPublicDecks: data.is_public_decks,
    createdAt: data.created_at,
  };
}

export async function fetchPublicCollection(
  supabase: SupabaseClient,
  userId: string
): Promise<DbCollection[]> {
  const { data, error } = await supabase
    .from("collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchPublicDecks(
  supabase: SupabaseClient,
  userId: string
): Promise<DeckRow[]> {
  const { data, error } = await supabase
    .from("decks")
    .select("*, deck_cards(id, quantity, card_id, price)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function upsertUserProfile(
  supabase: SupabaseClient,
  userId: string,
  updates: {
    username?: string;
    displayName?: string;
    avatarUrl?: string;
    isPublicCollection?: boolean;
    isPublicDecks?: boolean;
  }
): Promise<void> {
  const { error } = await supabase.from("user_profiles").upsert(
    {
      user_id: userId,
      username: updates.username?.toLowerCase().replace(/\s+/g, "_"),
      display_name: updates.displayName,
      avatar_url: updates.avatarUrl,
      is_public_collection: updates.isPublicCollection,
      is_public_decks: updates.isPublicDecks,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

export async function fetchOwnProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;

  return {
    userId: data.user_id,
    username: data.username,
    displayName: data.display_name ?? null,
    avatarUrl: data.avatar_url ?? null,
    isPublicCollection: data.is_public_collection,
    isPublicDecks: data.is_public_decks,
    createdAt: data.created_at,
  };
}
