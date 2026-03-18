-- 020_provider_sync_state.sql
-- Estado de sincronización por proveedor y tipo de sync.
-- Permite que los cron jobs sean idempotentes y reiniciables tras un crash.
-- El cursor guarda la posición (página/offset) para reanudar sin repetir trabajo.

CREATE TABLE IF NOT EXISTS public.provider_sync_state (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            TEXT        NOT NULL,      -- 'pokemontcg' | 'scryfall' | 'ygoprodeck' | 'bandai'
  game                TEXT        NOT NULL
                                  CHECK (game IN ('pokemon','magic','yugioh','onepiece')),
  sync_type           TEXT        NOT NULL
                                  CHECK (sync_type IN ('full_catalog','sets','prices')),
  status              TEXT        NOT NULL DEFAULT 'idle'
                                  CHECK (status IN ('idle','running','completed','failed')),
  last_started_at     TIMESTAMPTZ,
  last_completed_at   TIMESTAMPTZ,
  last_error          TEXT,
  cards_synced        INTEGER     NOT NULL DEFAULT 0,
  cursor              TEXT,                      -- página/offset donde reanudar si se interrumpió
  metadata            JSONB       NOT NULL DEFAULT '{}'::JSONB, -- datos arbitrarios por provider
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (provider, game, sync_type)
);

CREATE INDEX IF NOT EXISTS provider_sync_state_status_idx
  ON public.provider_sync_state (status);

-- Trigger para auto-actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_provider_sync_state_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER provider_sync_state_updated_at
  BEFORE UPDATE ON public.provider_sync_state
  FOR EACH ROW EXECUTE FUNCTION public.update_provider_sync_state_updated_at();

ALTER TABLE public.provider_sync_state ENABLE ROW LEVEL SECURITY;

-- Sólo el service role puede leer y escribir el estado de sync
-- (no es un dato que deba exponerse al frontend sin un dashboard de admin)
CREATE POLICY "sync_state_service_only"
  ON public.provider_sync_state FOR ALL
  USING (auth.role() = 'service_role');

-- Seed inicial de los proveedores conocidos
INSERT INTO public.provider_sync_state (provider, game, sync_type)
VALUES
  ('pokemontcg', 'pokemon',  'full_catalog'),
  ('pokemontcg', 'pokemon',  'sets'),
  ('scryfall',   'magic',    'full_catalog'),
  ('scryfall',   'magic',    'sets'),
  ('ygoprodeck', 'yugioh',   'full_catalog'),
  ('bandai',     'onepiece', 'full_catalog')
ON CONFLICT (provider, game, sync_type) DO NOTHING;
