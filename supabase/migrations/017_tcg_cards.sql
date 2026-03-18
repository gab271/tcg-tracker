-- 017_tcg_cards.sql
-- Catálogo local unificado de cartas de todos los juegos TCG.
-- Fuente principal de datos para búsqueda; el frontend no llama a APIs externas.

CREATE TABLE IF NOT EXISTS public.tcg_cards (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id     TEXT        NOT NULL,                    -- ID del provider (ej. "sv1-1", "scryfall-uuid")
  game            TEXT        NOT NULL
                              CHECK (game IN ('pokemon','magic','yugioh','onepiece')),
  set_id          UUID        REFERENCES public.tcg_sets(id) ON DELETE SET NULL,
  external_set_id TEXT,                                    -- FK suave para joins sin necesitar UUID
  name            TEXT        NOT NULL,
  image_small     TEXT,
  image_large     TEXT,
  rarity          TEXT,
  type_line       TEXT,                                    -- types/supertype según el juego
  number          TEXT,                                    -- número de coleccionista
  artist          TEXT,
  raw_data        JSONB       NOT NULL DEFAULT '{}'::JSONB, -- payload completo del provider
  synced_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (game, external_id)
);

-- Índice fulltext para búsqueda de nombre (config 'simple' es agnóstica al idioma)
CREATE INDEX IF NOT EXISTS tcg_cards_name_fts_idx
  ON public.tcg_cards
  USING gin(to_tsvector('simple', name));

-- Índices para filtros frecuentes
CREATE INDEX IF NOT EXISTS tcg_cards_game_idx
  ON public.tcg_cards (game);

CREATE INDEX IF NOT EXISTS tcg_cards_game_name_idx
  ON public.tcg_cards (game, name);

CREATE INDEX IF NOT EXISTS tcg_cards_set_idx
  ON public.tcg_cards (external_set_id);

CREATE INDEX IF NOT EXISTS tcg_cards_synced_idx
  ON public.tcg_cards (game, synced_at DESC);

ALTER TABLE public.tcg_cards ENABLE ROW LEVEL SECURITY;

-- Lectura pública — el catálogo de cartas no contiene datos sensibles
CREATE POLICY "tcg_cards_public_read"
  ON public.tcg_cards FOR SELECT
  USING (true);

-- Escritura exclusiva para service role (crons de sync y fallback on-demand)
CREATE POLICY "tcg_cards_service_write"
  ON public.tcg_cards FOR ALL
  USING (auth.role() = 'service_role');
