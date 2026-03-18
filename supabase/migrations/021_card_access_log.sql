-- 021_card_access_log.sql
-- Registro del acceso más reciente a cada carta.
-- El cron refresh-prices ordena por accessed_at DESC para priorizar
-- las cartas más vistas al renovar precios. Solo se guarda un registro
-- por carta (UPSERT); accessed_at siempre refleja el último acceso.

CREATE TABLE IF NOT EXISTS public.card_access_log (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT        NOT NULL,
  game          TEXT        NOT NULL
                            CHECK (game IN ('pokemon','magic','yugioh','onepiece')),
  accessed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Solo el acceso más reciente importa por carta
  UNIQUE (external_id, game)
);

-- Índice para que el cron lea el top-N de accesos recientes por juego
CREATE INDEX IF NOT EXISTS card_access_log_recent_idx
  ON public.card_access_log (game, accessed_at DESC);

ALTER TABLE public.card_access_log ENABLE ROW LEVEL SECURITY;

-- Escritura exclusiva para service role (las API routes usan createAdminClient)
CREATE POLICY "card_access_service_only"
  ON public.card_access_log FOR ALL
  USING (auth.role() = 'service_role');
