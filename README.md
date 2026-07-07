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
2. Create `.env.local` in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```
   Discord Client ID/Secret are configured in the Supabase dashboard, not here.
3. Run the SQL files in `supabase/migrations/` against your Supabase project, in order.
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
| `class-wallet` | Balance tracking, Momo QR collection with member self-reported payments, admin-approved transactions |
| `auth` | Discord OAuth2 login/logout, role lookup (`admin` / `member`) |
| `gold-price` | Domestic gold price dashboard + 24h history, viewable without auth |
| `muzik`, `wallet` | Scaffolding only |

## Further reading

Detailed architecture, coding style, security, and UI design system rules live in `.claude/rules/` and `CLAUDE.md` — read those before making structural changes.
