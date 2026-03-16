-- =============================================
-- Public User Profiles
-- =============================================

create table if not exists user_profiles (
  user_id              uuid        primary key references auth.users(id) on delete cascade,
  username             text        unique,
  display_name         text,
  avatar_url           text,
  is_public_collection boolean     not null default false,
  is_public_decks      boolean     not null default false,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

-- Case-insensitive username lookup
create index if not exists user_profiles_username_lower_idx
  on user_profiles(lower(username));

-- RLS: profiles are publicly readable, only owner can write
alter table user_profiles enable row level security;

create policy "Profiles are publicly viewable"
  on user_profiles for select
  using (true);

create policy "Users can insert own profile"
  on user_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update own profile"
  on user_profiles for update
  using (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_user_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger user_profiles_updated_at
  before update on user_profiles
  for each row execute function update_user_profiles_updated_at();

-- =============================================
-- Extend collection RLS: allow public reads
-- =============================================

-- The existing policy only allows auth.uid() = user_id.
-- This new policy additionally allows anyone to read a collection
-- when the owner has set is_public_collection = true.

create policy "Public collections are viewable by anyone"
  on collections for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.user_id = collections.user_id
        and user_profiles.is_public_collection = true
    )
  );

-- =============================================
-- Extend decks RLS: allow public reads
-- =============================================

create policy "Public decks are viewable by anyone"
  on decks for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.user_id = decks.user_id
        and user_profiles.is_public_decks = true
    )
  );
