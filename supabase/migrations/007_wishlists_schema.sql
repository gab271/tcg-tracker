-- =============================================
-- Feature: Wishlists
-- =============================================

create table if not exists public.wishlists (
  id         uuid          default gen_random_uuid() primary key,
  user_id    uuid          not null references auth.users(id) on delete cascade,
  card_id    text          not null,
  card_name  text          not null,
  card_image text,
  game       text          not null,
  max_price  numeric(12,2),               -- notify only if listing price <= max_price
  created_at timestamptz   default now(),
  unique (user_id, card_id)
);

create index if not exists wishlists_user_idx   on public.wishlists(user_id);
create index if not exists wishlists_card_idx   on public.wishlists(card_id);
create index if not exists wishlists_game_idx   on public.wishlists(game);

alter table public.wishlists enable row level security;

create policy "wishlist_owner_all"
  on public.wishlists for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());
