create table personal_transactions (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  amount      bigint      not null check (amount > 0),
  type        text        not null check (type in ('income', 'expense')),
  category    text        not null check (category in ('Food', 'Study', 'Transport', 'Entertainment', 'Others')),
  description text,
  created_at  timestamptz not null default now()
);

create index personal_transactions_user_id_idx on personal_transactions(user_id);

alter table personal_transactions enable row level security;

create policy "Users can view their own transactions"
  on personal_transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on personal_transactions for insert
  with check (auth.uid() = user_id);
