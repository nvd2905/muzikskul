# `auth` module

Discord + Google OAuth2 login via Supabase, current-user lookup, and admin gating. Reused across modules — the one exception to "Server Actions live inline in `page.tsx`".

## Features

- **Sign in with Discord or Google** — `LoginButton` renders two buttons, each a plain HTML form bound to a server action, so no client JS is needed to kick off the OAuth redirect.
- **Single callback for both providers** — `/auth/callback` exchanges the code for a session and lands the user on `/class-wallet` regardless of which provider they used.
- **Sign out** — clears the Supabase session and returns the user to `/`.
- **Current-user context everywhere** — every page that renders `Navbar` calls `getCurrentUser()` to show the signed-in name/avatar (falling back to Discord/Google profile data) or a signed-out state.
- **Role-gated admin actions** — pages that let admins approve/reject/adjust data (e.g. class-wallet) check `role === 'admin'` to show admin-only UI, and call `requireAdmin()` before the mutation actually runs.
- **Seamless account linking** — a member who first signs in with Discord and later uses Google (or vice versa) with the same verified email keeps one account, one role, and one transaction history; their originally-chosen display name never changes.

## Files

- `src/modules/auth/actions.ts` — `'use server'` actions, all exported.
- `src/modules/auth/components/LoginButton.tsx` — the only client component; renders sign-in buttons as forms bound to the server actions.

## Public API (`actions.ts`)

| Export | Type | Notes |
|---|---|---|
| `signInWithDiscord()` | server action | Builds `redirectTo` from `x-forwarded-proto`/`host` request headers (never hardcoded), calls `supabase.auth.signInWithOAuth`, redirects to Discord. |
| `signInWithGoogle()` | server action | Same pattern as Discord, provider `'google'`. |
| `signOut()` | server action | `supabase.auth.signOut()` then `redirect('/')`. |
| `getCurrentUser()` | async function | Calls `getUser()` (never `getSession()`), joins `profiles.role/username/avatar_url`, falls back to `user_metadata` if the profile columns are null. Returns `null` if unauthenticated. Safe to call from any Server Component. |
| `requireAdmin()` | async function | Calls `getCurrentUser()`, throws `Error('Unauthorized: admin access required')` if not an admin. Call at the top of any Server Action that mutates admin-only data. |
| `UserRole` | type | `'admin' \| 'member'` |

`getCurrentUser()` return shape:

```ts
{ id: string; email: string | null; name: string | null; avatarUrl: string | null; role: UserRole }
```

## OAuth flow

```
/login → LoginButton → signInWithDiscord()/signInWithGoogle() → supabase.auth.signInWithOAuth
  → provider consent → /auth/callback?code=... → exchangeCodeForSession → redirect /class-wallet
```

Both providers share the single `/auth/callback` route handler. Callback URL must be allowlisted in the Supabase dashboard **and** the provider's own console (Discord Developer Portal, Google Cloud Console) for both local (`http://localhost:3000/auth/callback`) and production.

## Account linking

If a Google sign-in email matches an existing Discord-based account, Supabase Auth's built-in identity linking merges them into the same `auth.users`/`profiles` row automatically — no custom linking code here. Requires the Supabase project's auto-linking setting to stay on.

- `handle_new_user` trigger populates `profiles` on `auth.users` insert.
- `handle_user_update` trigger (`013_sync_profile_on_user_update.sql`) keeps `profiles.email` current on `auth.users` update.
- `profiles.username` is **not** re-synced on update — deliberately, so linking a second provider never flips the display name depending on which provider last logged in.

## Rules specific to this module

- Never use `getSession()` — always `getUser()` (re-validates JWT server-side).
- `requireAdmin()` must run inside a `try/catch` in the calling Server Action so the `'Unauthorized...'` message can be mapped to a user-facing string (see `handleApprove` in `src/app/class-wallet/page.tsx`) rather than crashing the request.
- Gate admin-only UI with an `isAdmin` prop derived from `getCurrentUser().role` — don't rely on the `requireAdmin()` throw as the only safeguard, since it only protects the mutation, not the UI affordance.
