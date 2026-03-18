-- =============================================
-- Fix: Remove overly permissive RLS policy on price_alerts
--
-- The "alerts_service_update" policy used USING (true), which in Postgres
-- means any authenticated user could UPDATE any price_alert row (policies
-- of the same type are OR'd together). Combined with "alerts_owner_all",
-- this allowed user A to tamper with user B's last_price / last_triggered_at,
-- preventing legitimate alert notifications.
--
-- The service role key in Supabase bypasses RLS entirely without needing
-- an explicit permissive policy, so this policy is both unnecessary and unsafe.
-- =============================================

drop policy if exists "alerts_service_update" on public.price_alerts;
