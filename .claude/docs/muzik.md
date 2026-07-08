# `muzik` module

Route scaffolding only — no module directory under `src/modules/muzik/` yet, no real features.

## Features

- **None yet.** `/muzik` renders a "Coming soon" placeholder behind login (it's a protected route) — there is no functionality to describe until the module is built out.

## Files

- `src/app/muzik/page.tsx` — renders a "Coming soon" placeholder inside the standard page shell (`Navbar` + `min-h-screen bg-surface-base` main).

## Current behavior

```tsx
export default async function MuzikPage() {
  const user = await getCurrentUser()
  return (
    <main className="min-h-screen bg-surface-base">
      <Navbar user={user} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="font-orbitron text-2xl font-bold text-ink-primary">Muzik</h1>
        <p className="mt-1 text-sm text-ink-secondary">Coming soon</p>
      </div>
    </main>
  )
}
```

`/muzik` is listed in `PROTECTED_PREFIXES` (`src/middleware.ts`) — unauthenticated visitors are redirected to `/login` even though the page has no real content yet.

## When this module gets built out

Follow the standard module layout (`src/modules/muzik/services.ts`, `src/modules/muzik/components/`) per [architecture.md](../rules/architecture.md) — it must stay isolated from `class-wallet`, `wallet`, and `auth` like every other module. Update this doc with its actual services/types/data-model once real functionality lands; until then this file exists as a placeholder so `.claude/docs/` stays a complete index of every route-level area.
