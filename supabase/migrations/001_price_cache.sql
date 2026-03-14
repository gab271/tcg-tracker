-- price_cache: stores fetched card prices for 1-hour TTL caching
CREATE TABLE IF NOT EXISTS price_cache (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  card_id       TEXT NOT NULL,
  game          TEXT NOT NULL,        -- "pokemon" | "magic"
  card_name     TEXT,
  current_price DOUBLE PRECISION,
  price_history JSONB DEFAULT '[]',   -- array of { date, price }
  source        TEXT,                 -- "tcgdex" | "scryfall" | "pokemontcg.io/cardmarket"
  image_url     TEXT,
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (card_id, game)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_price_cache_lookup
  ON price_cache (card_id, game);
