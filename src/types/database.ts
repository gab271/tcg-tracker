/** Types matching Supabase database schema. */

// ── Offers ──────────────────────────────────────────────────────────────────
export interface DbOffer {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  buyer_username: string | null;
  offered_price: number;
  message: string | null;
  status: "pending" | "accepted" | "rejected" | "withdrawn" | "expired";
  created_at: string;
  updated_at: string;
  expires_at: string;
}

// ── Transactions ─────────────────────────────────────────────────────────────
export interface DbTransaction {
  id: string;
  listing_id: string;
  offer_id: string | null;
  buyer_id: string;
  seller_id: string;
  card_id: string;
  card_name: string;
  card_image: string | null;
  game: string;
  condition: string;
  final_price: number;
  buyer_username: string | null;
  seller_username: string | null;
  status: "pending" | "shipped" | "completed" | "cancelled" | "disputed";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ── Wishlists ─────────────────────────────────────────────────────────────────
export interface DbWishlistItem {
  id: string;
  user_id: string;
  card_id: string;
  card_name: string;
  card_image: string | null;
  game: string;
  max_price: number | null;
  created_at: string;
}

// ── Price Alerts ──────────────────────────────────────────────────────────────
export interface DbPriceAlert {
  id: string;
  user_id: string;
  card_id: string;
  card_name: string;
  card_image: string | null;
  game: string;
  target_price: number;
  direction: "below" | "above";
  is_active: boolean;
  last_triggered_at: string | null;
  last_price: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbDeck {
  id: string;
  user_id: string;
  name: string;
  game: string;
  cover_card_id: string | null;
  description?: string;
  format?: string;
  created_at: string;
  updated_at: string;
}

export interface DbDeckCard {
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

export interface DbPriceCache {
  id: number;
  card_id: string;
  game: string;
  card_name: string | null;
  current_price: number | null;
  price_history: PriceHistoryEntry[];
  source: string | null;
  image_url: string | null;
  cached_at: string;
}

export interface DbCollection {
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

export interface PriceHistoryEntry {
  date: string;
  price: number;
}

export interface DbMarketListing {
  id: string;
  seller_id: string;
  collection_item_id: string | null;
  card_id: string;
  card_name: string;
  card_image: string | null;
  game: string;
  rarity: string | null;
  condition: "mint" | "near_mint" | "played" | "damaged";
  price: number;
  status: "active" | "sold" | "cancelled";
  seller_username: string | null;
  seller_avatar: string | null;
  created_at: string;
  updated_at: string;
}
