# Security Rules

## Authentication

- Always validate sessions server-side with `supabase.auth.getUser()` — never `getSession()`.
  - `getSession()` trusts the client-side JWT without server verification. An attacker can forge a session.
  - `getUser()` re-validates the JWT against the Supabase Auth server on every call.
- Protected routes are enforced in `src/middleware.ts`, not in individual pages.
- Current protected paths: `/class-wallet`, `/my-wallet`. Add new protected routes here.

## Environment variables

| Variable | Prefix | Exposed to browser? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `NEXT_PUBLIC_` | Yes — intentional, safe |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_` | Yes — intentional, safe (anon key only) |
| `WALLET_ENCRYPTION_KEY` | none | Never — server-only, decrypts `personal_transactions` columns |
| Any service role key | none | Never — server-only, never `NEXT_PUBLIC_` |

- The **anon key** is safe to expose — Supabase RLS controls what it can access.
- The **service role key** bypasses RLS entirely — never put it in client code or `NEXT_PUBLIC_` vars.
- Never commit `.env.local` or any file containing real keys.

## Application-layer encryption

- RLS only protects access through the Supabase API (PostgREST/client SDK) — anyone with direct DB/dashboard access bypasses it entirely. For columns that must stay unreadable even to project members with raw table access, encrypt at the application layer before the value reaches Supabase.
- Pattern: `src/modules/wallet/crypto.ts` derives an AES-256-GCM key from `WALLET_ENCRYPTION_KEY` (never the DB) and exposes `encryptField`/`decryptField`. `services.ts` calls these at the read/write boundary so the rest of the module works with plaintext values — encryption never leaks into components or Server Actions.
- Only import a module's `crypto.ts` from that module's own `services.ts` — it uses Node's `crypto`, which breaks the client bundle if imported by a `'use client'` component (see [architecture.md](architecture.md) client/server boundary).
- Losing the encryption key permanently loses the encrypted data — treat it like a database credential, not a rotatable app secret.

## Row Level Security (RLS)

- Every Supabase table must have RLS enabled and at least one explicit policy.
- Disabling RLS for convenience is not acceptable in production.
- When creating a table, the migration must include:
  ```sql
  alter table <table> enable row level security;
  create policy "..." on <table> for select using (...);
  ```
- Default posture: deny all; grant minimum required access.

## Supabase queries

- Never concatenate user input into a query string — always use the Supabase client's parameterised API (`.eq()`, `.insert()`, `.update()`, etc.).
- Always select only the columns needed — avoid `select('*')` on tables with sensitive columns.
- Always check `error` before using `data`.

## Server Actions

- Server Actions run server-side but are callable from the browser — treat their arguments as untrusted user input.
- Validate that the calling user is authenticated before any mutation:
  ```ts
  async function handleAction(id: string) {
    'use server'
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    // ... proceed
  }
  ```

## OAuth

- The `redirectTo` URL in `signInWithDiscord` is built from request headers — never hardcoded.
- The `/auth/callback` route exchanges the OAuth code server-side; tokens never touch client JS.
- Both the Supabase dashboard and the Discord Developer Portal must explicitly allowlist the callback URL.

## General

- No secrets, tokens, or connection strings in source code.
- No PII in logs.
- No `dangerouslySetInnerHTML` unless the content is provably safe and sanitised.
