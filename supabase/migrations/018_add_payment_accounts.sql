-- Sub-accounts within a wallet (Cash, Bank, ...) so balances can be tracked
-- per payment method instead of only as one lump wallet balance. Balances
-- are derived from personal_transactions (sum of income - expense per
-- payment_account_id), same pattern as the wallet-level summary in
-- getWalletSummary — no stored balance column to keep a single source of
-- truth and avoid drift.
create table personal_payment_accounts (
  id         uuid        primary key default gen_random_uuid(),
  account_id uuid        not null references personal_accounts(id) on delete cascade,
  name       text        not null,
  type       text        not null default 'other' check (type in ('cash', 'bank', 'other')),
  created_by uuid        references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index personal_payment_accounts_account_id_idx on personal_payment_accounts(account_id);

-- Nullable: existing transactions predate this feature and aren't assigned
-- to any sub-account; they're excluded from the per-account matrix but still
-- count toward the wallet-level summary/category breakdown.
alter table personal_transactions
  add column payment_account_id uuid references personal_payment_accounts(id) on delete set null;

-- Seed every existing wallet with the two default sub-accounts the UI expects.
insert into personal_payment_accounts (account_id, name, type)
select id, 'Tiền mặt', 'cash' from personal_accounts
union all
select id, 'Ngân hàng', 'bank' from personal_accounts;

alter table personal_payment_accounts enable row level security;

create policy "Members can view wallet payment accounts"
  on personal_payment_accounts for select
  using (is_account_member(account_id));

create policy "Editors can create wallet payment accounts"
  on personal_payment_accounts for insert
  with check (can_edit_account(account_id));
