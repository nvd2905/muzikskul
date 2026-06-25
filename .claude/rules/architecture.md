# Architecture Rules

## Module system

All features live under `src/modules/<module>/`. Each module is fully self-contained.

```
src/modules/<module>/
├── services.ts          # server-side Supabase queries and types
└── components/
    └── *.tsx            # 'use client' components for this module only
```

**Modules must not import from each other.** `class-wallet`, `auth`, `muzik`, and `wallet` are isolated. If two modules need the same utility, it goes in `src/shared/`.

`src/shared/` is the only cross-module import path:
- `src/shared/components/` — reusable UI primitives
- `src/shared/hooks/` — reusable React hooks
- `src/shared/utils/` — pure utility functions

## Data flow

```
page.tsx (async Server Component)
  ├── calls services.ts functions directly — no fetch, no API route
  ├── defines Server Actions inline with 'use server' + revalidatePath
  └── passes data + action refs as props to Client Components
```

- Server Components own data fetching and mutations.
- Client Components (`'use client'`) handle interactivity only (event handlers, optimistic UI, browser APIs).
- No API routes for data — only for OAuth callbacks (`/auth/callback`) and webhooks.

## Supabase clients

Two distinct clients — never mix:

| Import | Use context |
|---|---|
| `import { createClient } from '@/supabase/server'` | Server Components, Server Actions, Route Handlers, Middleware |
| `import { createClient } from '@/supabase/client'` | `'use client'` components only |

The server client is `async`; the browser client is `sync`.

## Server Actions

- Defined **inline in `page.tsx`** with `'use server'`:
  ```ts
  async function handleAction(id: string) {
    'use server'
    await myServiceFn(id)
    revalidatePath('/my-route')
  }
  ```
- **Exception:** auth actions live in `src/modules/auth/actions.ts` because they are reused across pages.
- Always call `revalidatePath` after a mutation so the Server Component re-renders with fresh data.

## Auth

- Session validation: always `supabase.auth.getUser()` — never `getSession()` (trusts client-side JWT without server verification).
- Protected routes are enforced in `src/middleware.ts` — not in individual pages.
- OAuth flow: Discord → Supabase → `/auth/callback` → `/class-wallet`.
