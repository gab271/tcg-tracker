-- =============================================
-- Market Listings Table
-- =============================================

create table if not exists market_listings (
  id                 uuid          default gen_random_uuid() primary key,
  seller_id          uuid          not null references auth.users(id) on delete cascade,
  collection_item_id uuid          references collections(id) on delete set null,
  card_id            text          not null,
  card_name          text          not null,
  card_image         text,
  game               text          not null,
  rarity             text,
  condition          text          not null default 'near_mint'
                                   check (condition in ('mint', 'near_mint', 'played', 'damaged')),
  price              numeric(10,2) not null check (price > 0),
  status             text          not null default 'active'
                                   check (status in ('active', 'sold', 'cancelled')),
  seller_username    text,
  seller_avatar      text,
  created_at         timestamptz   default now(),
  updated_at         timestamptz   default now()
);

-- Indexes for common queries
create index if not exists market_listings_status_idx    on market_listings(status);
create index if not exists market_listings_game_idx      on market_listings(game);
create index if not exists market_listings_seller_id_idx on market_listings(seller_id);
create index if not exists market_listings_created_at_idx on market_listings(created_at desc);

-- Row Level Security
alter table market_listings enable row level security;

-- Anyone (including anon) can view active listings
create policy "Anyone can view active listings"
  on market_listings for select
  using (status = 'active' or auth.uid() = seller_id);

-- Authenticated sellers can create their own listings
create policy "Sellers can create listings"
  on market_listings for insert
  with check (auth.uid() = seller_id);

-- Sellers can update their own listings
create policy "Sellers can update own listings"
  on market_listings for update
  using (auth.uid() = seller_id);

-- Sellers can delete their own listings
create policy "Sellers can delete own listings"
  on market_listings for delete
  using (auth.uid() = seller_id);

-- Auto-update updated_at on row change
create or replace function update_market_listings_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger market_listings_updated_at
  before update on market_listings
  for each row execute function update_market_listings_updated_at();
