import type { SupabaseClient } from "@supabase/supabase-js";
import { avatarUploadSchema } from "@/lib/validations/profile";

export interface ProfileData {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  plan: "FREE" | "PRO";
  memberSince: string;
}

export async function fetchUserProfile(supabase: SupabaseClient): Promise<ProfileData | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const meta = user.user_metadata ?? {};
  const created = new Date(user.created_at);

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: meta.display_name ?? meta.full_name ?? user.email?.split("@")[0] ?? "User",
    avatarUrl: meta.avatar_url ?? null,
    plan: (meta.plan as "FREE" | "PRO") ?? "FREE",
    memberSince: created.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
  };
}

export interface UserStatsData {
  totalCards: number;
  totalValue: number;
  deckCount: number;
}

export async function fetchUserStats(supabase: SupabaseClient, userId: string): Promise<UserStatsData> {
  const [collectionResult, decksResult] = await Promise.all([
    supabase.from("collections").select("quantity, price").eq("user_id", userId),
    supabase.from("decks").select("id").eq("user_id", userId),
  ]);

  const collection = collectionResult.data ?? [];
  const totalCards = collection.reduce(
    (acc: number, item: { quantity?: number }) => acc + (item.quantity ?? 1),
    0
  );
  const totalValue = collection.reduce(
    (acc: number, item: { price?: number; quantity?: number }) =>
      acc + (item.price ?? 0) * (item.quantity ?? 1),
    0
  );

  return {
    totalCards,
    totalValue,
    deckCount: decksResult.data?.length ?? 0,
  };
}

export async function updateDisplayName(supabase: SupabaseClient, displayName: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });
  if (error) throw error;
}

export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<string> {
  // Validate file
  const validation = avatarUploadSchema.safeParse({ file });
  if (!validation.success) {
    throw new Error(validation.error.issues[0].message);
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filePath = `${userId}-${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(filePath, file, { upsert: true });
  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath);

  // Update user metadata with new avatar URL
  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: urlData.publicUrl },
  });
  if (updateError) throw updateError;

  return urlData.publicUrl;
}
