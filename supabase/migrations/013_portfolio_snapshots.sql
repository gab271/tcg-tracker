-- =============================================
-- Portfolio Value Snapshots
--
-- Guarda el valor total del portfolio de cada usuario una vez al día.
-- Permite mostrar un gráfico histórico real en el dashboard.
-- El cron job (/api/cron/snapshot-portfolio) escribe aquí diariamente.
-- =============================================

create table if not exists public.portfolio_snapshots (
  id          uuid    primary key default gen_random_uuid(),
  user_id     uuid    not null references auth.users(id) on delete cascade,
  snapshot_date date  not null,
  total_value numeric(12, 2) not null default 0,
  total_cards integer       not null default 0,
  created_at  timestamptz   not null default now(),

  -- Un snapshot por usuario por día
  unique (user_id, snapshot_date)
);

-- Índices para queries frecuentes
create index if not exists portfolio_snapshots_user_date
  on public.portfolio_snapshots (user_id, snapshot_date desc);

-- RLS: cada usuario sólo ve sus propios snapshots
alter table public.portfolio_snapshots enable row level security;

create policy "Users can read own snapshots"
  on public.portfolio_snapshots for select
  using (auth.uid() = user_id);

-- El service role (cron) puede insertar/actualizar
create policy "Service role can upsert snapshots"
  on public.portfolio_snapshots for all
  using (auth.uid() is null);
