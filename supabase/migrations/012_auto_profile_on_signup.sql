-- =============================================
-- Auto-crear user_profile al registrarse un nuevo usuario
--
-- Cuando Supabase Auth inserta una fila en auth.users, este trigger
-- crea automáticamente una fila en public.user_profiles con plan = 'FREE'.
-- Así nunca hay usuarios sin perfil y los límites de plan funcionan
-- correctamente desde el primer momento.
-- =============================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (
    user_id,
    display_name,
    avatar_url,
    plan,
    is_public_collection,
    is_public_decks
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url',
    'FREE',
    false,
    false
  )
  on conflict (user_id) do nothing; -- evita duplicados si el perfil ya existe
  return new;
end;
$$;

-- Eliminar trigger anterior si existía
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
