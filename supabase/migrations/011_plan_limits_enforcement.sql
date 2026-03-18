-- =============================================
-- Plan Limits Enforcement via DB Triggers
--
-- Enforces FREE plan limits at the database level so they cannot be
-- bypassed by calling the Supabase API directly (DevTools, REST, etc.).
--
-- FREE limits (must match src/lib/plan-limits.ts):
--   Collections : 100 cards
--   Decks       : 3 decks
--   Listings    : 5 active listings
--
-- PRO users are never blocked (no count check performed).
--
-- How it works:
--   Each BEFORE INSERT trigger reads the user's plan from user_profiles.
--   If FREE and at the limit, raises an exception with a machine-readable code.
--   The exception codes are caught in the client (hooks) and shown as toasts.
-- =============================================

-- ── Collections ────────────────────────────────────────────────────────────────

create or replace function enforce_collection_plan_limit()
returns trigger language plpgsql as $$
declare
  v_plan   text;
  v_count  integer;
begin
  -- Get user plan (defaults to FREE if no profile row yet)
  select coalesce(plan, 'FREE')
    into v_plan
    from public.user_profiles
   where user_id = new.user_id;

  if v_plan = 'PRO' then
    return new; -- PRO: unlimited
  end if;

  -- Count current cards (exclude the incoming row — it is not inserted yet)
  select count(*)
    into v_count
    from public.collections
   where user_id = new.user_id;

  if v_count >= 100 then
    raise exception 'plan_limit_cards'
      using hint = 'Free plan allows up to 100 cards. Upgrade to Pro for unlimited.';
  end if;

  return new;
end;
$$;

drop trigger if exists check_collection_plan_limit on public.collections;
create trigger check_collection_plan_limit
  before insert on public.collections
  for each row execute function enforce_collection_plan_limit();

-- ── Decks ──────────────────────────────────────────────────────────────────────

create or replace function enforce_deck_plan_limit()
returns trigger language plpgsql as $$
declare
  v_plan   text;
  v_count  integer;
begin
  select coalesce(plan, 'FREE')
    into v_plan
    from public.user_profiles
   where user_id = new.user_id;

  if v_plan = 'PRO' then
    return new;
  end if;

  select count(*)
    into v_count
    from public.decks
   where user_id = new.user_id;

  if v_count >= 3 then
    raise exception 'plan_limit_decks'
      using hint = 'Free plan allows up to 3 decks. Upgrade to Pro for unlimited.';
  end if;

  return new;
end;
$$;

drop trigger if exists check_deck_plan_limit on public.decks;
create trigger check_deck_plan_limit
  before insert on public.decks
  for each row execute function enforce_deck_plan_limit();

-- ── Market Listings ────────────────────────────────────────────────────────────

create or replace function enforce_listing_plan_limit()
returns trigger language plpgsql as $$
declare
  v_plan   text;
  v_count  integer;
begin
  select coalesce(plan, 'FREE')
    into v_plan
    from public.user_profiles
   where user_id = new.seller_id;

  if v_plan = 'PRO' then
    return new;
  end if;

  -- Only count active listings (cancelled/sold don't count against the limit)
  select count(*)
    into v_count
    from public.market_listings
   where seller_id = new.seller_id
     and status = 'active';

  if v_count >= 5 then
    raise exception 'plan_limit_listings'
      using hint = 'Free plan allows up to 5 active listings. Upgrade to Pro for unlimited.';
  end if;

  return new;
end;
$$;

drop trigger if exists check_listing_plan_limit on public.market_listings;
create trigger check_listing_plan_limit
  before insert on public.market_listings
  for each row execute function enforce_listing_plan_limit();
