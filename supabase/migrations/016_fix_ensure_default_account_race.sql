-- ensureDefaultAccount() (wallet/services.ts) did a client-side
-- select-then-insert against personal_accounts: check for an existing wallet,
-- insert one if missing. For a brand-new user this races against the
-- concurrent getAccessibleWallets() call in the same page load, and nothing
-- stopped two concurrent requests from both passing the "no wallet yet"
-- check. In practice new users hit "new row violates row-level security
-- policy for table personal_accounts" on first /my-wallet visit — the
-- insert's owner_id is supplied by the client rather than derived from the
-- session, which is fragile exactly in this kind of race/timing situation.
--
-- Fix: make wallet creation atomic and derive owner_id from auth.uid()
-- inside a security-definer function, same pattern as is_account_member/
-- can_edit_account below. A unique constraint on owner_id makes concurrent
-- creates collapse onto one row instead of erroring or duplicating.
drop index if exists personal_accounts_owner_id_idx;
alter table personal_accounts add constraint personal_accounts_owner_id_key unique (owner_id);

create or replace function public.ensure_default_account()
returns personal_accounts
language plpgsql
security definer
set search_path = public
as $$
declare
  acct personal_accounts;
begin
  insert into personal_accounts (owner_id)
  values (auth.uid())
  on conflict (owner_id) do nothing;

  select * into acct from personal_accounts where owner_id = auth.uid();
  return acct;
end;
$$;

grant execute on function public.ensure_default_account() to authenticated;
