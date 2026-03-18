-- 016_tcg_sets.sql
-- Catálogo local de sets/expansiones de todos los juegos TCG.
-- El service role (crons) escribe; lectura pública para el frontend.

CREATE TABLE IF NOT EXISTS public.tcg_sets (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT        NOT NULL,                    -- ID tal como lo devuelve el provider (ej. "sv1", "NEO")
  game          TEXT        NOT NULL
                            CHECK (game IN ('pokemon','magic','yugioh','onepiece')),
  name          TEXT        NOT NULL,
  series        TEXT,                                    -- agrupación lógica (ej. "Scarlet & Violet")
  printed_total INTEGER,                                 -- cartas impresas en el set
  total         INTEGER,                                 -- cartas en el set incluyendo secretas
  release_date  DATE,
  symbol_url    TEXT,
  logo_url      TEXT,
  raw_data      JSONB       NOT NULL DEFAULT '{}'::JSONB, -- payload completo del provider para replay
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (game, external_id)
);

CREATE INDEX IF NOT EXISTS tcg_sets_game_idx
  ON public.tcg_sets (game);

CREATE INDEX IF NOT EXISTS tcg_sets_release_idx
  ON public.tcg_sets (game, release_date DESC);

ALTER TABLE public.tcg_sets ENABLE ROW LEVEL SECURITY;

-- Lectura pública — el catálogo de sets no contiene datos sensibles
CREATE POLICY "tcg_sets_public_read"
  ON public.tcg_sets FOR SELECT
  USING (true);

-- Escritura exclusiva para service role (crons de sync)
CREATE POLICY "tcg_sets_service_write"
  ON public.tcg_sets FOR ALL
  USING (auth.role() = 'service_role');
