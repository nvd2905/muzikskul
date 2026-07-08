-- Lets each user add their own custom expense/income categories, on top of
-- the fixed built-in set (Food/Study/Transport/Entertainment/Others) that
-- ships in application code. `name` is encrypted at rest by the app, same as
-- amount/category/description on personal_transactions (WALLET_ENCRYPTION_KEY)
-- — so there is no DB-level unique constraint on it (AES-GCM output differs
-- per encryption even for the same plaintext); duplicate-name checks happen
-- in services.ts against the decrypted value.
create table personal_categories (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  name       text        not null,
  created_at timestamptz not null default now()
);

create index personal_categories_user_id_idx on personal_categories(user_id);

alter table personal_categories enable row level security;

create policy "Users can view their own categories"
  on personal_categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on personal_categories for insert
  with check (auth.uid() = user_id);
