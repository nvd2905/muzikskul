# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js App Router application (TypeScript, Tailwind CSS) — multi-module platform currently in early development. Supabase is the backend. The project name in the working directory is `muzikskul`; the primary product feature is `class-wallet`.

## Commands

```bash
npm run dev      # start dev server on http://localhost:3000
npm run build    # production build (also type-checks)
npm run lint     # ESLint via next lint
```

No test runner is configured yet.

## Architecture

### Module system

All features live under `src/modules/<module-name>/`. Each module is self-contained:

```
src/modules/<module>/
├── actions.ts           # 'use server' server actions (auth module only pattern)
├── services.ts          # server-side async functions (Supabase queries)
└── components/
    └── *.tsx            # client components for that module only
```

**Hard rule:** modules must not import from each other. `muzik`, `wallet`, `auth`, and `class-wallet` are fully isolated.

Shared utilities, hooks, and UI primitives go in `src/shared/` and may be imported by any module.

### Supabase clients

Two distinct clients — never mix them:

| File | Function | Use in |
|---|---|---|
| `src/supabase/client.ts` | `createClient()` sync | Client Components (`'use client'`) |
| `src/supabase/server.ts` | `createClient()` async | Server Components, Server Actions, Route Handlers, Middleware |

The server client reads/writes cookies via `next/headers` for session sync. The `setAll` catch block is intentional — Server Components cannot set cookies; only middleware and Route Handlers can.

Always call `supabase.auth.getUser()` to validate the session server-side. Never use `getSession()` — it trusts the client-side JWT without server verification.

Both clients read `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Data flow pattern (App Router)

```
page.tsx (Server Component)
  ├── calls services.ts functions directly (no fetch, no API route)
  ├── defines Server Actions inline with 'use server' + revalidatePath
  └── passes data + action refs as props to Client Components
```

Server Actions for data mutations are defined inline in `page.tsx`. The exception is auth — those live in `src/modules/auth/actions.ts` because they are reused across pages.

### Middleware (`src/middleware.ts`)

Runs on every non-static request. Responsibilities:
1. Refreshes the Supabase session cookie (must happen on every request via `createServerClient` + `setAll`).
2. Redirects unauthenticated users hitting `/class-wallet`, `/my-wallet`, or `/muzik` to `/login`.
3. Redirects authenticated users hitting `/login` to `/class-wallet`.

Protected path prefixes live in `PROTECTED_PREFIXES` in `src/middleware.ts` — add new ones there.

The matcher excludes `/auth/callback` so the OAuth code-exchange route can set the session cookie before any redirect logic fires.

### OAuth flow (Discord via Supabase)

```
/login
  └── LoginButton (form action) → signInWithDiscord() server action
        └── supabase.auth.signInWithOAuth → redirect to Discord
              └── Discord → /auth/callback?code=...
                    └── exchangeCodeForSession → redirect to /class-wallet
```

The `redirectTo` URL in `signInWithDiscord` is constructed from request headers (`x-forwarded-proto` + `host`) so it works in both local dev and production without a hardcoded env var.

Both the Supabase dashboard (Authentication → URL Configuration) and the Discord Developer Portal (OAuth2 → Redirects) must have `http://localhost:3000/auth/callback` in their allowlists for local development.

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
WALLET_ENCRYPTION_KEY=
```

Discord Client ID and Secret are stored in the Supabase dashboard (Authentication → Providers → Discord), not in `.env`.

`WALLET_ENCRYPTION_KEY` is a server-only secret (never `NEXT_PUBLIC_`) used by `src/modules/wallet/crypto.ts` to AES-256-GCM encrypt/decrypt `amount`, `category`, and `description` on `personal_transactions` before they hit the database — so a project member with raw table/dashboard access sees ciphertext, not plaintext financial data. Losing this key makes existing encrypted rows permanently unreadable; back it up outside the repo the same way you would a database password.

### Roles (`profiles` table)

`profiles` mirrors `auth.users` (one row per user, `id` is the FK) and adds a `role` column (`'admin' | 'member'`, default `'member'`) plus `email`/`username`. A `handle_new_user` trigger on `auth.users` keeps it populated on signup; see `supabase/migrations/003_add_profiles_role.sql` and `004_add_email_username_to_profiles.sql`.

`getCurrentUser()` in `src/modules/auth/actions.ts` joins `profiles.role` onto the returned user object. `requireAdmin()` (same file) throws if the caller isn't an admin — call it at the top of any Server Action that mutates admin-only data (see `handleApprove`/`handleReject`/`handleAdjustBalance` in `src/app/class-wallet/page.tsx`), and gate the corresponding UI with `isAdmin` props rather than relying on the throw alone.

RLS is enabled on `class_funds` and `class_transactions` (`supabase/migrations/005_enable_rls_class_wallet.sql`): any authenticated user can read fund status/transactions and insert a `pending` transaction (self-reported payment); only admins (checked via `profiles.role`) can update fund balance, approve/reject transactions, or insert a pre-`approved` transaction. `class_transactions.status` allows `'pending' | 'approved' | 'rejected'` (`009_add_rejected_status.sql`).

`class_transactions.user_id` (nullable, `references profiles(id)`, `010_add_user_id_to_class_transactions.sql`) links a self-reported payment to the reporting user, so donor totals can be matched by account rather than by free-text `payer_name`. The insert RLS policy requires `user_id is null or user_id = auth.uid()` — a user can't attribute a payment to someone else's account. Admin-entered adjustments (`adjustFundBalance`) never set `user_id`; it stays free-text only.

`profiles`' own RLS only allows `auth.uid() = id` (read your own row) — it does **not** allow reading other users' rows, including via an embedded/joined select. Anything that needs another user's display name (e.g. the class-wallet top-donors leaderboard) must go through the `get_all_usernames()` `security definer` RPC (`011_add_get_all_usernames_rpc.sql`), which exposes only `id, username` — never widen the `profiles` SELECT policy itself, since profiles also holds `email`.

## Current modules

- **`class-wallet`** — class fund management: balance tracking, Momo QR payment collection with member self-reported payments (`reportPayment`, name defaults to the reporter's Discord username), admin approve/reject of pending transactions (`approveTransaction`/`rejectTransaction`), manual balance adjustment restricted to admins, a top-3-donors leaderboard (`getTopDonors`, grouped by `user_id`), and status filter/search/pagination on the transactions table (`FundTable.tsx`, client-side).
- **`auth`** — Discord OAuth2 login/logout via Supabase. `actions.ts` exports `signInWithDiscord`, `signOut`, `getCurrentUser`, and `requireAdmin`. `LoginButton.tsx` is the only client component.
- **`gold-price`** — domestic gold price dashboard (`GoldPriceDashboard`, `GoldSavingsTracker`) with a 24h SJC price history; viewable without auth, with an inline sign-in CTA.
- **`wallet`** — personal income/expense tracker (`/my-wallet`): quick-add form, running balance, `amount`/`category`/`description` encrypted at rest via `WALLET_ENCRYPTION_KEY` (see above).
- **`muzik`** — route scaffolding only (`/muzik` renders a "Coming soon" placeholder); no real features yet.

## Deployment

Auto-deploy to a VPS via GitHub Actions on each published Release (`.github/workflows/deploy.yml`) — pushing to `main` does **not** deploy by itself. Cut a release with `./scripts/release.sh "<notes>"` (auto-bumps the patch version from the latest tag). The Action SSHes in and runs `scripts/deploy.sh <tag>`, which checks out the tag, rebuilds, and reloads the app under PM2. Full VPS setup, the production topology (this app currently shares its VPS and reverse proxy with an unrelated, pre-existing Dockerized app), and required GitHub secrets are documented in `docs/DEPLOYMENT.md` — read it before changing anything deploy-related, since the actual production setup deviates from a fresh-VPS default in ways that matter (see that file's "Production topology as actually deployed" section).
