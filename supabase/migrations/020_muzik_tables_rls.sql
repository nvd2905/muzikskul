-- Muzik module tables (created by Prisma: `prisma migrate`) live in the same
-- Supabase Postgres. The app reaches them ONLY through Prisma's direct/pooled
-- connection, which authenticates as the database owner and bypasses RLS. They
-- are never exposed through PostgREST / the Supabase anon client.
--
-- Per this repo's security rule ("every table must have RLS enabled with at
-- least one explicit policy; default deny"), we enable RLS with NO policies, so
-- the anon/authenticated PostgREST roles get zero access. This does not affect
-- the app (Prisma bypasses RLS as owner) — it just closes the PostgREST door.
--
-- Run this AFTER `prisma migrate` has created the tables.

alter table if exists public.users            enable row level security;
alter table if exists public.sessions         enable row level security;
alter table if exists public.rooms            enable row level security;
alter table if exists public.participants     enable row level security;
alter table if exists public.tracks           enable row level security;
alter table if exists public.queue_items      enable row level security;
alter table if exists public.chat_messages    enable row level security;

-- No policies are defined on purpose: default-deny for every PostgREST role.
-- (Prisma connects as the table owner and is unaffected by RLS.)
