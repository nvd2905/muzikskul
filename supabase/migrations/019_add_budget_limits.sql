-- Per-category spending limits, set by wallet editors, compared against
-- actual expense totals in the app to render budget progress bars.
-- `category` and `limit_amount` are encrypted at rest by the app (same
-- WALLET_ENCRYPTION_KEY as personal_transactions) since a limit amount is
-- financial data and the category pairs it with a spending intent — same
-- posture as personal_transactions. As with personal_categories, AES-GCM
-- output differs per encryption call, so there's no DB-level unique
-- constraint on category; one-per-category-per-wallet is enforced in
-- services.ts by decrypting and comparing before insert/update.
create table budget_limits (
  id           uuid        primary key default gen_random_uuid(),
  account_id   uuid        not null references personal_accounts(id) on delete cascade,
  category     text        not null,
  limit_amount text        not null,
  created_by   uuid        references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index budget_limits_account_id_idx on budget_limits(account_id);

alter table budget_limits enable row level security;

create policy "Members can view wallet budget limits"
  on budget_limits for select
  using (is_account_member(account_id));

create policy "Editors can manage wallet budget limits"
  on budget_limits for insert
  with check (can_edit_account(account_id));

create policy "Editors can update wallet budget limits"
  on budget_limits for update
  using (can_edit_account(account_id));

create policy "Editors can delete wallet budget limits"
  on budget_limits for delete
  using (can_edit_account(account_id));
