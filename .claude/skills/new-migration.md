# Skill: Create a Supabase migration

Use this whenever a new table, column, index, or RLS policy is needed.

## File naming

```
supabase/migrations/<NNN>_<slug>.sql
```

- `<NNN>` increments from the last migration (current: `001`).
- `<slug>` is lowercase hyphenated, describes the change (e.g. `002_add-student-table.sql`).

## Template

```sql
-- ============================================================
-- <NNN>: <short description>
-- ============================================================

-- 1. Table
create table <table_name> (
  id          uuid        primary key default gen_random_uuid(),
  -- foreign key example:
  fund_id     text        not null references class_funds(id),
  -- common field types:
  name        text        not null,
  amount      bigint      not null default 0,        -- monetary: store VND as integer
  status      text        not null default 'pending'
                check (status in ('pending', 'approved')),
  metadata    jsonb,
  invoice_url text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Index (add when queries filter or order by this column)
create index on <table_name> (fund_id);
create index on <table_name> (created_at desc);

-- 3. RLS — ALWAYS include; never leave a table without policies
alter table <table_name> enable row level security;

-- Public read (adjust to authenticated-only if needed)
create policy "Anyone can read <table_name>"
  on <table_name> for select
  using (true);

-- Authenticated write
create policy "Authenticated users can insert <table_name>"
  on <table_name> for insert
  with check (auth.uid() is not null);

create policy "Authenticated users can update <table_name>"
  on <table_name> for update
  using (auth.uid() is not null);

-- 4. Seed data (optional — only for reference/lookup data)
insert into <table_name> (...) values (...);
```

## Type conventions

| Use case | Postgres type |
|---|---|
| Surrogate primary key | `uuid` with `default gen_random_uuid()` |
| Natural/business key | `text` |
| Foreign key to `class_funds` | `text not null references class_funds(id)` |
| Monetary amount (VND) | `bigint` |
| Timestamps | `timestamptz not null default now()` |
| Short enum-style strings | `text` with a `check (... in (...))` constraint |
| Free text | `text` |
| Structured JSON | `jsonb` |

## How to apply

Migrations are **not** run automatically. Run them in the Supabase dashboard:

1. **Supabase dashboard → SQL Editor**
2. Paste the migration SQL and click **Run**
3. Verify in **Table Editor** that the table and policies were created

## Rules

- Never edit a migration that has already been applied — add a new one.
- Every new table must have RLS enabled and at least one policy.
- Foreign keys must reference a column that already exists (respect ordering — `class_funds` before `class_transactions`).
- Don't drop or rename columns in production migrations — add new columns and migrate data separately.
