-- =============================================
-- Feature: Market Transactions & Offers
-- =============================================

-- ── Offers: buyer proposes a price to seller ──────────────────────────────
create table if not exists public.market_offers (
  id             uuid          default gen_random_uuid() primary key,
  listing_id     uuid          not null references public.market_listings(id) on delete cascade,
  buyer_id       uuid          not null references auth.users(id) on delete cascade,
  seller_id      uuid          not null references auth.users(id) on delete cascade,
  buyer_username text,
  offered_price  numeric(12,2) not null check (offered_price > 0),
  message        text,
  status         text          not null default 'pending'
                               check (status in ('pending','accepted','rejected','withdrawn','expired')),
  created_at     timestamptz   default now(),
  updated_at     timestamptz   default now(),
  expires_at     timestamptz   default (now() + interval '48 hours')
);

-- ── Transactions: completed/in-progress purchases ─────────────────────────
create table if not exists public.market_transactions (
  id              uuid          default gen_random_uuid() primary key,
  listing_id      uuid          not null references public.market_listings(id),
  offer_id        uuid          references public.market_offers(id),
  buyer_id        uuid          not null references auth.users(id) on delete cascade,
  seller_id       uuid          not null references auth.users(id) on delete cascade,
  card_id         text          not null,
  card_name       text          not null,
  card_image      text,
  game            text          not null,
  condition       text          not null,
  final_price     numeric(12,2) not null,
  buyer_username  text,
  seller_username text,
  status          text          not null default 'pending'
                                check (status in ('pending','shipped','completed','cancelled','disputed')),
  notes           text,
  created_at      timestamptz   default now(),
  updated_at      timestamptz   default now()
);

-- ── Indexes ────────────────────────────────────────────────────────────────
create index if not exists market_offers_listing_idx  on public.market_offers(listing_id);
create index if not exists market_offers_buyer_idx    on public.market_offers(buyer_id);
create index if not exists market_offers_seller_idx   on public.market_offers(seller_id);
create index if not exists market_offers_status_idx   on public.market_offers(status);
create index if not exists market_txn_buyer_idx       on public.market_transactions(buyer_id);
create index if not exists market_txn_seller_idx      on public.market_transactions(seller_id);
create index if not exists market_txn_status_idx      on public.market_transactions(status);

-- ── RLS ───────────────────────────────────────────────────────────────────
alter table public.market_offers      enable row level security;
alter table public.market_transactions enable row level security;

-- Offers: visible only to buyer or seller
create policy "offers_select"
  on public.market_offers for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "offers_insert"
  on public.market_offers for insert
  with check (buyer_id = auth.uid());

create policy "offers_update"
  on public.market_offers for update
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- Transactions: visible only to buyer or seller
create policy "txn_select"
  on public.market_transactions for select
  using (buyer_id = auth.uid() or seller_id = auth.uid());

create policy "txn_update"
  on public.market_transactions for update
  using (buyer_id = auth.uid() or seller_id = auth.uid());

-- ── updated_at triggers ────────────────────────────────────────────────────
create or replace function update_market_offers_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger market_offers_updated_at
  before update on public.market_offers
  for each row execute function update_market_offers_updated_at();

create or replace function update_market_transactions_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger market_transactions_updated_at
  before update on public.market_transactions
  for each row execute function update_market_transactions_updated_at();

-- ── RPC: buy_listing ──────────────────────────────────────────────────────
-- Atomically: validates listing is active, marks it sold, creates transaction.
-- SECURITY DEFINER lets this bypass RLS while still checking auth.uid().
create or replace function buy_listing(
  p_listing_id    uuid,
  p_buyer_username text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_listing market_listings%rowtype;
  v_txn_id  uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_listing
  from market_listings
  where id = p_listing_id and status = 'active'
  for update;

  if not found then
    raise exception 'listing_not_available';
  end if;

  if v_listing.seller_id = auth.uid() then
    raise exception 'cannot_buy_own_listing';
  end if;

  update market_listings
  set status = 'sold', updated_at = now()
  where id = p_listing_id;

  insert into market_transactions (
    listing_id, buyer_id, seller_id,
    card_id, card_name, card_image,
    game, condition, final_price,
    buyer_username, seller_username
  ) values (
    p_listing_id, auth.uid(), v_listing.seller_id,
    v_listing.card_id, v_listing.card_name, v_listing.card_image,
    v_listing.game, v_listing.condition, v_listing.price,
    p_buyer_username, v_listing.seller_username
  )
  returning id into v_txn_id;

  return v_txn_id;
end;
$$;

-- ── RPC: accept_offer ─────────────────────────────────────────────────────
-- Atomically: accepts offer, rejects all others, marks listing sold, creates transaction.
create or replace function accept_offer(p_offer_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer   market_offers%rowtype;
  v_listing market_listings%rowtype;
  v_txn_id  uuid;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_offer
  from market_offers
  where id = p_offer_id
  for update;

  if not found then raise exception 'offer_not_found'; end if;
  if v_offer.seller_id != auth.uid() then raise exception 'not_seller'; end if;
  if v_offer.status != 'pending' then raise exception 'offer_not_pending'; end if;
  if v_offer.expires_at < now() then raise exception 'offer_expired'; end if;

  select * into v_listing
  from market_listings
  where id = v_offer.listing_id and status = 'active'
  for update;

  if not found then raise exception 'listing_not_available'; end if;

  -- Accept this offer
  update market_offers
  set status = 'accepted', updated_at = now()
  where id = p_offer_id;

  -- Reject all other pending offers on this listing
  update market_offers
  set status = 'rejected', updated_at = now()
  where listing_id = v_offer.listing_id
    and id != p_offer_id
    and status = 'pending';

  -- Mark listing sold
  update market_listings
  set status = 'sold', updated_at = now()
  where id = v_offer.listing_id;

  -- Create transaction at the offered price
  insert into market_transactions (
    listing_id, offer_id, buyer_id, seller_id,
    card_id, card_name, card_image,
    game, condition, final_price,
    buyer_username, seller_username
  ) values (
    v_offer.listing_id, p_offer_id, v_offer.buyer_id, auth.uid(),
    v_listing.card_id, v_listing.card_name, v_listing.card_image,
    v_listing.game, v_listing.condition, v_offer.offered_price,
    v_offer.buyer_username, v_listing.seller_username
  )
  returning id into v_txn_id;

  return v_txn_id;
end;
$$;
