-- =============================================
-- Feature: Price Alerts
-- =============================================

create table if not exists public.price_alerts (
  id                uuid          default gen_random_uuid() primary key,
  user_id           uuid          not null references auth.users(id) on delete cascade,
  card_id           text          not null,
  card_name         text          not null,
  card_image        text,
  game              text          not null,
  target_price      numeric(12,2) not null check (target_price > 0),
  -- 'below': alert when market price drops below target_price
  -- 'above': alert when market price rises above target_price
  direction         text          not null default 'below'
                                  check (direction in ('below','above')),
  is_active         boolean       not null default true,
  last_triggered_at timestamptz,
  last_price        numeric(12,2),        -- last known price when checked
  created_at        timestamptz   default now(),
  updated_at        timestamptz   default now()
);

create index if not exists price_alerts_user_idx   on public.price_alerts(user_id);
create index if not exists price_alerts_active_idx on public.price_alerts(is_active) where is_active = true;
create index if not exists price_alerts_card_idx   on public.price_alerts(card_id);

alter table public.price_alerts enable row level security;

create policy "alerts_owner_all"
  on public.price_alerts for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Service role can update last_price / last_triggered_at (edge function)
create policy "alerts_service_update"
  on public.price_alerts for update
  using (true);

create or replace function update_price_alerts_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger price_alerts_updated_at
  before update on public.price_alerts
  for each row execute function update_price_alerts_updated_at();
