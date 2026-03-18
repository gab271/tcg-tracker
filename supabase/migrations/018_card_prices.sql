-- 018_card_prices.sql
-- Precios actuales por carta con TTL soft de 1 hora.
-- Reemplaza el rol de price_cache para cartas del catálogo local.
-- price_cache se mantiene sin cambios para compatibilidad con código existente.

CREATE TABLE IF NOT EXISTS public.card_prices (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tcg_card_id   UUID        REFERENCES public.tcg_cards(id) ON DELETE CASCADE,
  external_id   TEXT        NOT NULL,              -- copia denormalizada para lookups sin JOIN
  game          TEXT        NOT NULL
                            CHECK (game IN ('pokemon','magic','yugioh','onepiece')),
  currency      TEXT        NOT NULL DEFAULT 'EUR'
                            CHECK (currency IN ('EUR','USD')),
  price         NUMERIC(12,4),                     -- precio de mercado principal
  price_foil    NUMERIC(12,4),                     -- variante foil cuando el juego la tiene
  source        TEXT        NOT NULL,              -- 'pokemontcg.io/cardmarket' | 'scryfall' | 'ygoprodeck'
  fetched_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (external_id, game, currency)
);

CREATE INDEX IF NOT EXISTS card_prices_external_idx
  ON public.card_prices (external_id, game);

-- Índice para encontrar precios vencidos por juego en el cron de refresh
CREATE INDEX IF NOT EXISTS card_prices_stale_idx
  ON public.card_prices (game, fetched_at DESC);

CREATE INDEX IF NOT EXISTS card_prices_tcg_card_idx
  ON public.card_prices (tcg_card_id);

ALTER TABLE public.card_prices ENABLE ROW LEVEL SECURITY;

-- Lectura pública — precios son datos de mercado sin información sensible
CREATE POLICY "card_prices_public_read"
  ON public.card_prices FOR SELECT
  USING (true);

-- Escritura exclusiva para service role
CREATE POLICY "card_prices_service_write"
  ON public.card_prices FOR ALL
  USING (auth.role() = 'service_role');
