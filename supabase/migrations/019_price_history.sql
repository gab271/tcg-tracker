-- 019_price_history.sql
-- Snapshot diario de precios por carta, moneda y fuente.
-- Un registro máximo por (carta, moneda, día) — el UNIQUE lo garantiza.
-- El cron refresh-prices escribe aquí cada vez que actualiza precios.
-- El endpoint /api/card-price lee los últimos 30 snapshots para el gráfico.

CREATE TABLE IF NOT EXISTS public.price_history (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id   TEXT        NOT NULL,
  game          TEXT        NOT NULL
                            CHECK (game IN ('pokemon','magic','yugioh','onepiece')),
  currency      TEXT        NOT NULL DEFAULT 'EUR'
                            CHECK (currency IN ('EUR','USD')),
  price         NUMERIC(12,4) NOT NULL,
  source        TEXT        NOT NULL,
  snapshot_date DATE        NOT NULL DEFAULT CURRENT_DATE,

  -- Un snapshot por (carta, moneda, día) — idempotente
  UNIQUE (external_id, game, currency, snapshot_date)
);

-- Índice principal para leer historial de una carta específica
CREATE INDEX IF NOT EXISTS price_history_lookup_idx
  ON public.price_history (external_id, game, currency, snapshot_date DESC);

-- Índice secundario para limpiezas futuras por fecha
CREATE INDEX IF NOT EXISTS price_history_date_idx
  ON public.price_history (snapshot_date DESC);

ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;

-- Lectura pública — historial de precios es dato de mercado
CREATE POLICY "price_history_public_read"
  ON public.price_history FOR SELECT
  USING (true);

-- Escritura exclusiva para service role
CREATE POLICY "price_history_service_write"
  ON public.price_history FOR ALL
  USING (auth.role() = 'service_role');
