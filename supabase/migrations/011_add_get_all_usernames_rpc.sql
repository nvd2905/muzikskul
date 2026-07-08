-- profiles RLS only allows a user to read their own row (auth.uid() = id).
-- Donor display names need every payer's username, so expose just id+username
-- via a security-definer function instead of broadening the profiles policy
-- (which would also expose email to every authenticated user).
create function public.get_all_usernames()
returns table (id uuid, username text)
language sql
security definer
set search_path = public
stable
as $$
  select id, username from profiles;
$$;

grant execute on function public.get_all_usernames() to authenticated;
