# MuzikSkul

Multi-module platform built with Next.js (App Router) and Supabase, currently in early development. The primary feature is **class-wallet** — class fund tracking with Momo QR payment collection, member self-reported payments, and admin-approved transactions.

## Stack

- [Next.js 15](https://nextjs.org/) (App Router) + React 19 + TypeScript
- [Supabase](https://supabase.com/) (Postgres, Auth, RLS)
- Tailwind CSS with a custom dark cyberpunk design system (see `.claude/rules/ui-design-system.md`)
- Discord OAuth2 via Supabase Auth

## Getting started

### Prerequisites

- Node.js 20+
- A Supabase project (Discord provider enabled under Authentication → Providers)

### Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create `.env.local` in the project root (already gitignored — never commit it):
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   WALLET_ENCRYPTION_KEY=
   ```
   Discord Client ID/Secret are configured in the Supabase dashboard, not here.

   | Variable | Where it comes from | Notes |
   |---|---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard → Project Settings → API | Safe to expose to the browser; RLS controls access. |
   | `WALLET_ENCRYPTION_KEY` | Generate once: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | Server-only, never `NEXT_PUBLIC_`. Encrypts/decrypts `amount`, `category`, `description` on `personal_transactions` (`src/modules/wallet/crypto.ts`) so a project member with raw table/dashboard access sees ciphertext, not real financial data. **Share it out-of-band (password manager), never via git or chat.** Losing it permanently loses every encrypted row — back it up like a database credential. Every teammate's local `.env.local` needs the same value to read wallet data seeded by others. |
3. Run the SQL files in `supabase/migrations/` against your Supabase project, in order. If `personal_transactions` (from `006_create_personal_transactions.sql`) already exists in your project from before wallet encryption was added, `007_encrypt_personal_transactions.sql` truncates it and alters it to the encrypted-column shape — confirm there's no real data in that table before running it.
4. In both the Supabase dashboard (Authentication → URL Configuration) and the Discord Developer Portal (OAuth2 → Redirects), allowlist:
   ```
   http://localhost:3000/auth/callback
   ```
5. Start the dev server:
   ```bash
   npm run dev
   ```
   App runs at [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev      # start dev server
npm run build    # production build (also type-checks)
npm run start    # run a production build
npm run lint     # ESLint via next lint
```

No test runner is configured yet.

## Project structure

```
src/app/                    # routes (Server Components)
src/modules/<module>/       # self-contained feature modules
  services.ts                 server-side Supabase queries + types
  actions.ts                   'use server' actions (auth module only)
  components/                  'use client' components for this module
src/shared/                 # cross-module UI primitives, hooks, utils
src/supabase/               # browser + server Supabase clients
src/middleware.ts           # session refresh + route protection
supabase/migrations/        # SQL migrations, applied in order
```

Modules do not import from each other — see `.claude/rules/architecture.md` for the full architecture and data-flow rules.

## Modules

| Module | Status |
|---|---|
| `class-wallet` | Balance tracking, Momo QR collection with member self-reported payments (name defaults to your Discord username), admin approve/reject, a top-3-donors leaderboard, and a filterable/paginated transaction history |
| `auth` | Discord OAuth2 login/logout, role lookup (`admin` / `member`) |
| `gold-price` | Domestic gold price dashboard + 24h history, viewable without auth |
| `wallet` | Personal income/expense tracker (`/my-wallet`) — quick-add form, running balance, encrypted `amount`/`category`/`description` (see `WALLET_ENCRYPTION_KEY` above) |
| `muzik` | Scaffolding only |

## Deployment

Production deploys run through GitHub Actions on each published Release — merging to `main` does not deploy by itself. To ship:

```bash
./scripts/release.sh "<what changed>"   # cuts a release, auto-bumps the patch version
```

That triggers `.github/workflows/deploy.yml`, which SSHes into the VPS and runs `scripts/deploy.sh` (checkout tag → build → reload under PM2). Full one-time VPS setup and required GitHub secrets are in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Further reading

Detailed architecture, coding style, security, and UI design system rules live in `.claude/rules/` and `CLAUDE.md` — read those before making structural changes.
