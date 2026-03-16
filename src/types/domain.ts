/** Business domain types used across the application. */

import type { PriceHistoryEntry } from "./database";

export type TCGGame = "Pokemon" | "Magic" | "OnePiece" | "YuGiOh";

/** Display labels for each game */
export const TCG_GAME_LABELS: Record<TCGGame, string> = {
  Pokemon: "Pokemon",
  Magic: "Magic: The Gathering",
  OnePiece: "One Piece",
  YuGiOh: "Yu-Gi-Oh!",
};

export type CardCondition = "mint" | "near_mint" | "played" | "damaged";

export type ListingStatus = "active" | "sold" | "cancelled";

export type OfferStatus = "pending" | "accepted" | "rejected" | "withdrawn";

export type MessageStatus = "sent" | "delivered" | "seen";

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  plan: "FREE" | "PRO";
  createdAt: string;
}

export interface UserStats {
  totalCards: number;
  totalValue: number;
  deckCount: number;
  listingCount: number;
}

export interface CollectionCard {
  id: string;
  cardId: string;
  name: string;
  image: string | null;
  game: string;
  rarity: string;
  price: number;
  quantity: number;
}

export interface PriceData {
  currentPrice: number | null;
  currency: string;
  source: string;
  name: string;
  image: string | null;
  priceHistory: PriceHistoryEntry[];
  cached: boolean;
  cachedAt?: string;
}

export interface CardSearchResult {
  id: string;
  name: string;
  image: string;
  game: string;
  rarity: string;
  price: number;
}

export interface Deck {
  id: string;
  userId: string;
  name: string;
  game: string;
  coverCardId: string | null;
  description?: string;
  format?: string;
  createdAt: string;
  updatedAt: string;
  cardCount?: number;
  totalValue?: number;
}

export interface MarketListing {
  id: string;
  sellerId: string;
  collectionItemId: string | null;
  cardId: string;
  cardName: string;
  cardImage: string | null;
  game: string;
  rarity: string | null;
  condition: CardCondition;
  price: number;
  status: ListingStatus;
  sellerUsername: string | null;
  sellerAvatar: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DeckCard {
  id: string;
  deckId: string;
  cardId: string;
  name: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  orderIndex: number;
}
