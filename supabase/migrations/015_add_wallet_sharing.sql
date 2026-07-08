-- Introduces a wallet as a first-class entity (personal_accounts) so it can
-- be shared between multiple users (e.g. spouses), replacing the implicit
-- "wallet == one user" model. `user_id` on personal_transactions/categories
-- now means *creator*, not *owning wallet*; the new account_id column says
-- *which wallet* a row belongs to. wallet_shares tracks who else has access
-- and at what permission level.

create table personal_accounts (
  id         uuid        primary key default gen_random_uuid(),
  owner_id   uuid        not null references auth.users(id) on delete cascade,
  name       text        not null default 'My Wallet',
  created_at timestamptz not null default now()
);

create index personal_accounts_owner_id_idx on personal_accounts(owner_id);

-- Every existing user gets one backfilled owned wallet.
insert into personal_accounts (owner_id)
select id from profiles;

alter table personal_transactions add column account_id uuid references personal_accounts(id) on delete cascade;
update personal_transactions t
  set account_id = a.id
  from personal_accounts a
  where a.owner_id = t.user_id;
alter table personal_transactions alter column account_id set not null;
create index personal_transactions_account_id_idx on personal_transactions(account_id);

alter table personal_categories add column account_id uuid references personal_accounts(id) on delete cascade;
update personal_categories c
  set account_id = a.id
  from personal_accounts a
  where a.owner_id = c.user_id;
alter table personal_categories alter column account_id set not null;
create index personal_categories_account_id_idx on personal_categories(account_id);

-- A wallet's transaction history should survive a creator's account being
-- removed or their share revoked, rather than disappearing with them.
alter table personal_transactions drop constraint personal_transactions_user_id_fkey;
alter table personal_transactions alter column user_id drop not null;
alter table personal_transactions
  add constraint personal_transactions_user_id_fkey
  foreign key (user_id) references auth.users(id) on delete set null;

create table wallet_shares (
  id                  uuid        primary key default gen_random_uuid(),
  account_id          uuid        not null references personal_accounts(id) on delete cascade,
  shared_with_user_id uuid        not null references auth.users(id) on delete cascade,
  permission_level    text        not null default 'view' check (permission_level in ('view', 'edit')),
  created_at          timestamptz not null default now(),
  unique (account_id, shared_with_user_id)
);

create index wallet_shares_shared_with_user_id_idx on wallet_shares(shared_with_user_id);

-- security definer to avoid RLS recursion: personal_accounts and wallet_shares
-- policies would otherwise each need to query the other.
create function public.is_account_member(p_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from personal_accounts where id = p_account_id and owner_id = auth.uid()
  ) or exists (
    select 1 from wallet_shares where account_id = p_account_id and shared_with_user_id = auth.uid()
  );
$$;

create function public.can_edit_account(p_account_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from personal_accounts where id = p_account_id and owner_id = auth.uid()
  ) or exists (
    select 1 from wallet_shares
    where account_id = p_account_id and shared_with_user_id = auth.uid() and permission_level = 'edit'
  );
$$;

grant execute on function public.is_account_member(uuid) to authenticated;
grant execute on function public.can_edit_account(uuid) to authenticated;

-- profiles SELECT only allows reading your own row, so resolving an invite
-- email to a user id needs a security-definer function. Trade-off: this lets
-- an authenticated caller probe whether an arbitrary email is registered
-- (enumeration); acceptable here since invites require an exact match and
-- this is a small trusted app, not a public signup surface.
create function public.find_user_by_email(p_email text)
returns table (id uuid, username text)
language sql
security definer
set search_path = public
stable
as $$
  select id, username from profiles where email = p_email;
$$;

grant execute on function public.find_user_by_email(text) to authenticated;

alter table personal_accounts enable row level security;
alter table wallet_shares enable row level security;

create policy "Members can view accessible wallets"
  on personal_accounts for select
  using (is_account_member(id));

create policy "Users can create their own wallet"
  on personal_accounts for insert
  with check (owner_id = auth.uid());

create policy "Owners can update their wallet"
  on personal_accounts for update
  using (owner_id = auth.uid());

create policy "Owners can delete their wallet"
  on personal_accounts for delete
  using (owner_id = auth.uid());

create policy "Owners and recipients can view their shares"
  on wallet_shares for select
  using (
    shared_with_user_id = auth.uid()
    or exists (select 1 from personal_accounts where id = account_id and owner_id = auth.uid())
  );

create policy "Owners can invite members"
  on wallet_shares for insert
  with check (exists (select 1 from personal_accounts where id = account_id and owner_id = auth.uid()));

create policy "Owners can revoke members"
  on wallet_shares for delete
  using (exists (select 1 from personal_accounts where id = account_id and owner_id = auth.uid()));

drop policy "Users can view their own transactions" on personal_transactions;
drop policy "Users can insert their own transactions" on personal_transactions;

create policy "Members can view wallet transactions"
  on personal_transactions for select
  using (is_account_member(account_id));

create policy "Editors can insert wallet transactions"
  on personal_transactions for insert
  with check (can_edit_account(account_id) and user_id = auth.uid());

create policy "Editors can update wallet transactions"
  on personal_transactions for update
  using (can_edit_account(account_id));

drop policy "Users can view their own categories" on personal_categories;
drop policy "Users can insert their own categories" on personal_categories;

create policy "Members can view wallet categories"
  on personal_categories for select
  using (is_account_member(account_id));

create policy "Editors can insert wallet categories"
  on personal_categories for insert
  with check (can_edit_account(account_id));
