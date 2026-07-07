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
```

Discord Client ID and Secret are stored in the Supabase dashboard (Authentication → Providers → Discord), not in `.env`.

### Roles (`profiles` table)

`profiles` mirrors `auth.users` (one row per user, `id` is the FK) and adds a `role` column (`'admin' | 'member'`, default `'member'`) plus `email`/`username`. A `handle_new_user` trigger on `auth.users` keeps it populated on signup; see `supabase/migrations/003_add_profiles_role.sql` and `004_add_email_username_to_profiles.sql`.

`getCurrentUser()` in `src/modules/auth/actions.ts` joins `profiles.role` onto the returned user object. `requireAdmin()` (same file) throws if the caller isn't an admin — call it at the top of any Server Action that mutates admin-only data (see `handleApprove`/`handleAdjustBalance` in `src/app/class-wallet/page.tsx`), and gate the corresponding UI with `isAdmin` props rather than relying on the throw alone.

RLS is enabled on `class_funds` and `class_transactions` (`supabase/migrations/005_enable_rls_class_wallet.sql`): any authenticated user can read fund status/transactions and insert a `pending` transaction (self-reported payment); only admins (checked via `profiles.role`) can update fund balance, approve transactions, or insert a pre-`approved` transaction.

## Current modules

- **`class-wallet`** — class fund management: balance tracking, Momo QR payment collection with member self-reported payments (`reportPayment`), admin-approved transactions that auto-adjust the fund balance (`approveTransaction`), and manual balance adjustment restricted to admins (see Roles above).
- **`auth`** — Discord OAuth2 login/logout via Supabase. `actions.ts` exports `signInWithDiscord`, `signOut`, `getCurrentUser`, and `requireAdmin`. `LoginButton.tsx` is the only client component.
- **`gold-price`** — domestic gold price dashboard (`GoldPriceDashboard`, `GoldSavingsTracker`) with a 24h SJC price history; viewable without auth, with an inline sign-in CTA.
- **`muzik`**, **`wallet`** — route/module scaffolding only (`/muzik` renders a "Coming soon" placeholder); no real features yet.
