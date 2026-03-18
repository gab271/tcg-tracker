-- =============================================
-- Feature: Plan column in user_profiles
--
-- Moves plan (FREE/PRO) from user_metadata to DB.
-- user_metadata is user-editable via supabase.auth.updateUser(),
-- which allows any user to self-upgrade to PRO for free.
-- =============================================

-- 1. Add plan column
alter table public.user_profiles
  add column if not exists plan text not null default 'FREE'
  check (plan in ('FREE', 'PRO'));

-- 2. Trigger: block plan changes by regular authenticated users.
--    Service role key sets auth.uid() = NULL (bypasses auth entirely),
--    so we allow plan updates only when auth.uid() IS NULL (i.e. admin/service role).
create or replace function block_plan_self_update()
returns trigger language plpgsql as $$
begin
  if new.plan <> old.plan and auth.uid() is not null then
    raise exception 'plan_change_forbidden'
      using hint = 'Plan can only be updated via admin/service role operations';
  end if;
  return new;
end;
$$;

create trigger prevent_user_plan_change
  before update on public.user_profiles
  for each row execute function block_plan_self_update();
