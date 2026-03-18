-- =============================================
-- Listing Photos
--
-- Añade un array de URLs de fotos a market_listings.
-- Permite a los vendedores subir fotos reales del estado físico de la carta
-- (almacenadas en Supabase Storage bucket "listing-photos").
-- =============================================

alter table public.market_listings
  add column if not exists photos text[] default '{}';

-- Bucket de storage para las fotos (ejecutar en el dashboard de Supabase o via CLI)
-- insert into storage.buckets (id, name, public) values ('listing-photos', 'listing-photos', true);
-- Policy: vendedor puede subir al path seller_id/*
