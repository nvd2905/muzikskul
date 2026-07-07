-- 006 shipped amount/category as plaintext. Moving to application-layer
-- AES-256-GCM encryption (see src/modules/wallet/crypto.ts) so raw table or
-- Supabase dashboard access never exposes plaintext financial data. type stays
-- plaintext to allow income/expense filtering; only the app holds the key
-- (WALLET_ENCRYPTION_KEY), so it — not this migration — can (de)encrypt values.
--
-- Any rows inserted before this migration were stored in plaintext and cannot
-- be re-encrypted in SQL. This feature has not shipped to real users yet, so
-- we truncate rather than attempt a data migration. If that's no longer true
-- when you run this, export/re-encrypt those rows via the app first.
truncate table personal_transactions;

alter table personal_transactions
  drop constraint if exists personal_transactions_category_check;

alter table personal_transactions
  drop constraint if exists personal_transactions_amount_check;

alter table personal_transactions
  alter column amount type text using amount::text;
