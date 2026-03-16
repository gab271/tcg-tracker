/** Types matching Supabase database schema. */

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
