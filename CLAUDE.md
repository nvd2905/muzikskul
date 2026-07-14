# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Next.js App Router application (TypeScript, Tailwind CSS) — multi-module platform currently in early development. Supabase is the backend. The project name in the working directory is `muzikskul`; the primary product feature is `class-wallet`.

## Commands

```bash
npm run dev      # custom Node server (tsx watch src/server.ts) — Next + Socket.IO + workers, http://localhost:3000
npm run dev:next # plain `next dev` WITHOUT the socket server (muzik realtime won't work; use for non-muzik work)
npm run build    # prisma generate && next build (also type-checks)
npm run start    # production: cross-env NODE_ENV=production tsx src/server.ts
npm run lint     # ESLint via next lint (not configured in this repo yet)
npm run db:migrate  # prisma migrate dev (needs DATABASE_URL + DIRECT_URL — see muzik module note)
```

No test runner is configured yet.

> **Note:** `npm run dev`/`start` run a **custom Node server** (`src/server.ts`), not plain `next dev`/`next start`. This is required by the `muzik` module (Socket.IO + background workers). It still serves the whole app, so all other modules work unchanged. See the `muzik` module note below.

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
3. Redirects authenticated users hitting `/login` to `/` (home).

Protected path prefixes live in `PROTECTED_PREFIXES` in `src/middleware.ts` — add new ones there.

The matcher excludes `/auth/callback` so the OAuth code-exchange route can set the session cookie before any redirect logic fires.

### OAuth flow (Discord + Google via Supabase)

```
/login
  └── LoginButton (form actions) → signInWithDiscord() / signInWithGoogle() server action
        └── supabase.auth.signInWithOAuth → redirect to Discord / Google
              └── provider → /auth/callback?code=...
                    └── exchangeCodeForSession → redirect to `next` query param, default `/`
```

The `redirectTo` URL in `signInWithDiscord`/`signInWithGoogle` is constructed from request headers (`x-forwarded-proto` + `host`) so it works in both local dev and production without a hardcoded env var. Both actions share the same `/auth/callback` route. `/auth/callback` (`src/app/auth/callback/route.ts`) reads an optional `?next=` query param and redirects there after exchanging the code; when absent it redirects to `/` (home) — pages that want the user back on themselves after a login detour (e.g. `gold-price/page.tsx`'s own sign-in action) pass `next` explicitly.

Both the Supabase dashboard (Authentication → URL Configuration) and each provider's developer console (Discord Developer Portal → OAuth2 → Redirects; Google Cloud Console → APIs & Services → Credentials → Authorized redirect URIs) must have `http://localhost:3000/auth/callback` in their allowlists for local development, plus the production callback URL for the deployed domain.

**Account linking:** if a user signs in with Google using an email that already has a Discord-based account, Supabase Auth's built-in identity linking merges the new Google identity into the existing `auth.users` row (same `profiles` row, same role/history) — this happens automatically when both providers report a verified email, with no custom linking code in this repo. It requires the Supabase project's Auth setting that allows automatic linking to be left at its default (on); do not disable it. `handle_new_user` only fires on `auth.users` insert; a second trigger, `handle_user_update` (`013_sync_profile_on_user_update.sql`), fires on `auth.users` update to keep `profiles.email` current when a linked login refreshes it. `profiles.username` is intentionally *not* re-synced on update — it stays whatever was set at signup, so linking a second provider never changes the display name (re-syncing it previously caused the name to flip depending on which provider logged in most recently).

### Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
WALLET_ENCRYPTION_KEY=
```

Discord Client ID and Secret are stored in the Supabase dashboard (Authentication → Providers → Discord), not in `.env`.

`WALLET_ENCRYPTION_KEY` is a server-only secret (never `NEXT_PUBLIC_`) used by `src/modules/wallet/crypto.ts` to AES-256-GCM encrypt/decrypt `amount`, `category`, and `description` on `personal_transactions` before they hit the database — so a project member with raw table/dashboard access sees ciphertext, not plaintext financial data. Losing this key makes existing encrypted rows permanently unreadable; back it up outside the repo the same way you would a database password.

### Roles (`profiles` table)

`profiles` mirrors `auth.users` (one row per user, `id` is the FK) and adds a `role` column (`'admin' | 'member'`, default `'member'`) plus `email`/`username`/`avatar_url`. A `handle_new_user` trigger on `auth.users` keeps it populated on signup; see `supabase/migrations/003_add_profiles_role.sql`, `004_add_email_username_to_profiles.sql`, and `014_add_avatar_url_to_profiles.sql`. `username` and `avatar_url` are set once at signup and never re-synced from a later linked login (see the account-linking note above) — `getCurrentUser()` reads both from `profiles`, falling back to live `user_metadata` only if the `profiles` value is null (e.g. rows created before `014`).

`getCurrentUser()` in `src/modules/auth/actions.ts` joins `profiles.role` onto the returned user object. `requireAdmin()` (same file) throws if the caller isn't an admin — call it at the top of any Server Action that mutates admin-only data (see `handleApprove`/`handleReject`/`handleAdjustBalance` in `src/app/class-wallet/page.tsx`), and gate the corresponding UI with `isAdmin` props rather than relying on the throw alone.

RLS is enabled on `class_funds` and `class_transactions` (`supabase/migrations/005_enable_rls_class_wallet.sql`): any authenticated user can read fund status/transactions and insert a `pending` transaction (self-reported payment); only admins (checked via `profiles.role`) can update fund balance, approve/reject transactions, or insert a pre-`approved` transaction. `class_transactions.status` allows `'pending' | 'approved' | 'rejected'` (`009_add_rejected_status.sql`).

`class_transactions.user_id` (nullable, `references profiles(id)`, `010_add_user_id_to_class_transactions.sql`) links a self-reported payment to the reporting user, so donor totals can be matched by account rather than by free-text `payer_name`. The insert RLS policy requires `user_id is null or user_id = auth.uid()` — a user can't attribute a payment to someone else's account. Admin-entered adjustments (`adjustFundBalance`) never set `user_id`; it stays free-text only.

`profiles`' own RLS only allows `auth.uid() = id` (read your own row) — it does **not** allow reading other users' rows, including via an embedded/joined select. Anything that needs another user's display name (e.g. the class-wallet top-donors leaderboard) must go through the `get_all_usernames()` `security definer` RPC (`011_add_get_all_usernames_rpc.sql`), which exposes only `id, username` — never widen the `profiles` SELECT policy itself, since profiles also holds `email`.

## Current modules

- **`class-wallet`** — class fund management: balance tracking, Momo QR payment collection with member self-reported payments (`reportPayment`, name defaults to the reporter's Discord username), admin approve/reject of pending transactions (`approveTransaction`/`rejectTransaction`), manual balance adjustment restricted to admins, a top-3-donors leaderboard (`getTopDonors`, grouped by `user_id`), and status filter/search/pagination on the transactions table (`FundTable.tsx`, client-side).
- **`auth`** — Discord OAuth2 login/logout via Supabase. `actions.ts` exports `signInWithDiscord`, `signOut`, `getCurrentUser`, and `requireAdmin`. `LoginButton.tsx` is the only client component.
- **`gold-price`** — domestic gold price dashboard (`GoldPriceDashboard`, `GoldSavingsTracker`) with a 24h SJC price history; viewable without auth, with an inline sign-in CTA.
- **`wallet`** — personal income/expense tracker (`/my-wallet`): quick-add form, running balance, `amount`/`category`/`description` encrypted at rest via `WALLET_ENCRYPTION_KEY` (see above).
- **`muzik`** — real-time collaborative music-listening (ported from the standalone MMMuzik-v2). Create/join/browse rooms, a collaborative YouTube queue, **server-authoritative playback sync**, live chat, presence, and in-app YouTube search. Routes: `/muzik` (hub), `/muzik/rooms` (browse), `/muzik/room/[roomId]` (the room), `/muzik/join/[code]` (invite). REST under `/api/rooms/**` + `/api/session` + `/api/health`; realtime mutations over Socket.IO. See the deviations note below.

## The `muzik` module — intentional deviations from the repo rules

`muzik` was ported from a standalone Socket.IO + Prisma + Redis app. To make it run inside muzikskul it **intentionally breaks four rules** — do not "fix" these; they are load-bearing:

1. **Custom server, not `next dev`/`next start`.** `src/server.ts` (run via `tsx`) boots Next + attaches Socket.IO + starts 3 background workers (`advanceWorker`, `roomReaperWorker`, `presenceFinalizerWorker`) in one process. WebSockets can't live in request-scoped handlers.
2. **API routes for data** (`src/app/api/rooms/**`, `/api/session`, `/api/health`) — the module's REST layer (create/join/leave + snapshots/history/search). Realtime mutations (queue/playback/chat) go over Socket.IO, not server actions.
3. **Prisma, not the Supabase JS client**, for the muzik tables — pointed at Supabase's *own* Postgres via `DATABASE_URL` (pooled) + `DIRECT_URL` (direct, for migrations). Schema: `prisma/schema.prisma` (7 tables: users, sessions, rooms, participants, tracks, queue_items, chat_messages). `supabase/migrations/020_muzik_tables_rls.sql` enables **RLS deny-all** on them (Prisma connects as owner and bypasses RLS; this just closes the PostgREST door so the "every table has RLS" rule still holds).
4. **A second Tailwind design-token set** — the module uses HSL-var tokens (`bg-background`, `bg-surface`, `text-primary`, `text-mmz-accent`, `text-success`, …) scoped to `.muzik-scope` (applied by `src/app/muzik/layout.tsx`) so they never leak onto other pages. MMMuzik's `accent` (magenta) was renamed to **`mmz-accent`** to avoid colliding with muzikskul's cyan `accent`. Everything under `src/modules/muzik/**` is self-contained (module isolation still holds).

**Infra substitutions vs upstream:** Redis was dropped for single-instance operation — `src/modules/muzik/lib/redis.ts` is an in-memory shim (same command surface), broadcasts use a `globalThis`-shared Socket.IO instance (`server/socket/io.ts` + `server/realtime/emitter.ts`) instead of the Redis adapter/emitter, and the pino logger is a `console` shim (`lib/logger.ts`). **Consequence: horizontal scaling needs real Redis re-introduced.** Deploy (`docs/DEPLOYMENT.md`, PM2, GitHub Action) still needs updating for the custom server + `DATABASE_URL`/`DIRECT_URL` secrets — not yet done.

**Guest identity:** the module keeps its own anonymous `mmmuzik_session` cookie (nickname prompt), independent of the Supabase login. `/muzik` is still behind the Supabase auth gate in `middleware.ts`.

## Deployment

Auto-deploy to a VPS via GitHub Actions on each published Release (`.github/workflows/deploy.yml`) — pushing to `main` does **not** deploy by itself. Cut a release with `./scripts/release.sh "<notes>"` (auto-bumps the patch version from the latest tag). The Action SSHes in and runs `scripts/deploy.sh <tag>`, which checks out the tag, rebuilds, and reloads the app under PM2. Full VPS setup, the production topology (this app currently shares its VPS and reverse proxy with an unrelated, pre-existing Dockerized app), and required GitHub secrets are documented in `docs/DEPLOYMENT.md` — read it before changing anything deploy-related, since the actual production setup deviates from a fresh-VPS default in ways that matter (see that file's "Production topology as actually deployed" section).
