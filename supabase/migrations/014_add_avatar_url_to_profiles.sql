-- Mirrors the username fix in 013: avatar_url was never persisted at all, so
-- getCurrentUser() always read it live from auth.users.raw_user_meta_data,
-- meaning it silently flipped to whichever provider last linked/logged in.
-- Persist it once at signup instead, same as username, so it stays stable.
alter table profiles add column avatar_url text;

update public.profiles p
set avatar_url = u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
where p.id = u.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, username, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;
