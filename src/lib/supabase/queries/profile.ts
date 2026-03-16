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

export interface GameDistributionEntry {
  game: string;
  count: number;
  value: number;
}

export interface RecentActivityEntry {
  id: string;
  name: string;
  game: string;
  price: number;
  createdAt: string;
}

export interface TopCard {
  name: string;
  game: string;
  price: number;
  image: string | null;
}

export interface UserStatsData {
  totalCards: number;
  totalValue: number;
  deckCount: number;
  listingCount: number;
  gameDistribution: GameDistributionEntry[];
  topCard: TopCard | null;
  recentActivity: RecentActivityEntry[];
}

export async function fetchUserStats(supabase: SupabaseClient, userId: string): Promise<UserStatsData> {
  const [collectionResult, decksResult, listingsResult] = await Promise.all([
    supabase
      .from("collections")
      .select("card_name, game, price, quantity, card_image, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase.from("decks").select("id").eq("user_id", userId),
    supabase
      .from("market_listings")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", userId)
      .eq("status", "active"),
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

  // Game distribution grouped by game name
  const gameMap = new Map<string, { count: number; value: number }>();
  for (const item of collection) {
    const game = (item.game as string) ?? "Unknown";
    const existing = gameMap.get(game) ?? { count: 0, value: 0 };
    gameMap.set(game, {
      count: existing.count + (item.quantity ?? 1),
      value: existing.value + (item.price ?? 0) * (item.quantity ?? 1),
    });
  }
  const gameDistribution: GameDistributionEntry[] = Array.from(gameMap.entries())
    .map(([game, stats]) => ({ game, count: stats.count, value: stats.value }))
    .sort((a, b) => b.count - a.count);

  // Crown jewel: highest unit-price card
  type CollectionItem = { card_name: string; game: string; price: number; quantity: number; card_image: string | null; created_at: string };
  const topCardRow = (collection as CollectionItem[]).reduce(
    (best: CollectionItem | null, item) =>
      !best || (item.price ?? 0) > (best.price ?? 0) ? item : best,
    null
  );
  const topCard: TopCard | null = topCardRow
    ? { name: topCardRow.card_name, game: topCardRow.game, price: topCardRow.price ?? 0, image: topCardRow.card_image ?? null }
    : null;

  // Recent activity: last 4 items added
  const recentActivity: RecentActivityEntry[] = (collection as CollectionItem[])
    .slice(0, 4)
    .map((item) => ({
      id: `${item.card_name}-${item.created_at}`,
      name: item.card_name,
      game: item.game,
      price: item.price ?? 0,
      createdAt: item.created_at,
    }));

  return {
    totalCards,
    totalValue,
    deckCount: decksResult.data?.length ?? 0,
    listingCount: listingsResult.count ?? 0,
    gameDistribution,
    topCard,
    recentActivity,
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
