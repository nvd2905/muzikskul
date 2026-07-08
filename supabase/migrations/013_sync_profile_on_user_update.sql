-- handle_new_user only fires on auth.users INSERT, so profiles.email was
-- frozen at signup and went stale once a later linked login (e.g. Google
-- linking into an existing Discord-based account) refreshed auth.users with
-- newer provider data. This app treats one profiles row as one person, so
-- mirror email into profiles on every relevant UPDATE too, not just insert.
--
-- username is deliberately NOT re-synced here: doing so previously made the
-- displayed name flip between providers (Discord tag vs Google display name)
-- depending on whichever provider last refreshed auth.users. For now, the
-- username set at signup is treated as the single source of truth.
create or replace function public.handle_user_update()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_updated on auth.users;

create trigger on_auth_user_updated
  after update on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute procedure public.handle_user_update();
