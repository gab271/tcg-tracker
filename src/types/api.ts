/** API request/response types. */

export interface CardPriceResponse {
  currentPrice: number | null;
  priceHistory: { date: string; price: number }[];
  currency: string;
  source: string;
  name: string;
  image: string | null;
  cached: boolean;
  cachedAt?: string;
}

export interface ApiErrorResponse {
  error: string;
}
