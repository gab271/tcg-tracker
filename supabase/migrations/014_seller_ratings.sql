-- =============================================
-- Seller Ratings
--
-- Permite a compradores valorar a vendedores después de completar
-- una transacción. Una valoración por transacción.
-- =============================================

create table if not exists public.seller_ratings (
  id             uuid  primary key default gen_random_uuid(),
  transaction_id uuid  not null references public.market_transactions(id) on delete cascade,
  reviewer_id    uuid  not null references auth.users(id) on delete cascade,
  seller_id      uuid  not null references auth.users(id) on delete cascade,
  rating         smallint not null check (rating between 1 and 5),
  comment        text,
  created_at     timestamptz not null default now(),

  -- Un review por transacción
  unique (transaction_id, reviewer_id)
);

create index if not exists seller_ratings_seller_id on public.seller_ratings (seller_id);
create index if not exists seller_ratings_transaction_id on public.seller_ratings (transaction_id);

alter table public.seller_ratings enable row level security;

-- Cualquiera puede leer ratings (para ver la reputación del vendedor)
create policy "Anyone can read ratings"
  on public.seller_ratings for select
  using (true);

-- Sólo el comprador de la transacción puede escribir el rating
create policy "Buyer can insert rating"
  on public.seller_ratings for insert
  with check (auth.uid() = reviewer_id);

-- Vista agregada: avg rating y total por vendedor
create or replace view public.seller_rating_stats as
select
  seller_id,
  round(avg(rating)::numeric, 2)  as avg_rating,
  count(*)::integer                as total_ratings
from public.seller_ratings
group by seller_id;
