# Shared Wallet (Family/Couples Budgeting) Implementation Plan

**Goal:** Let multiple users (e.g. spouses) view, contribute to, and manage the same personal wallet, with per-member permission levels and per-transaction creator attribution.

**Modules touched:** `wallet` (all changes), `src/app/my-wallet/page.tsx`. No other module is imported from or modified.

**DB changes:** YES — new migration `supabase/migrations/015_add_wallet_sharing.sql`:
- New table `personal_accounts` (the wallet entity).
- New table `wallet_shares`.
- New column `account_id` on `personal_transactions` and `personal_categories`.
- New security-definer helper functions + RPC.
- Rewritten RLS on `personal_transactions`, `personal_categories`, `personal_accounts`, `wallet_shares`.

---

## Key architectural decision (READ FIRST — needs sign-off)

The current schema has **no wallet entity**: a wallet == one user (`personal_transactions.user_id → auth.users`). Sharing is impossible until the wallet becomes a first-class row. This plan therefore **introduces `personal_accounts`** and separates two concepts that `user_id` currently conflates:

| Concept | Today | After |
|---|---|---|
| Which wallet a row belongs to | `user_id` (implicit) | `account_id → personal_accounts` |
| Who created a row | `user_id` | `user_id` (kept, now means *creator*) |

Every existing user gets one backfilled default account; existing transactions/categories are backfilled to that account. This is the minimum model that satisfies "share a wallet" **and** "show who created each transaction."

**Encryption decision:** keep the single global `WALLET_ENCRYPTION_KEY` / `crypto.ts` unchanged. It already encrypts all rows with one server-side key (protection against raw-DB/dashboard access), while per-user access is enforced by RLS. Sharing is purely an *authorization* change (RLS), not an *encryption* change: any RLS-authorized member already decrypts via `services.ts`. Per-wallet key derivation from a single global secret would add key-wrapping complexity with no security gain, so it is deliberately **not** done. No ciphertext ever leaves `services.ts` (unchanged boundary).

---

## Tasks

### 1. Database migration
- [ ] **[supabase/migrations/015_add_wallet_sharing.sql]** — single migration, in this order:
  - [ ] Create `personal_accounts` (`id` uuid pk, `owner_id` uuid not null → `auth.users(id)` on delete cascade, `name` text not null default `'My Wallet'` — plaintext, wallet name is not sensitive financial data, `created_at` timestamptz). Index on `owner_id`.
  - [ ] Backfill one account per user: `insert into personal_accounts (owner_id) select id from profiles;`
  - [ ] Add nullable `account_id uuid references personal_accounts(id) on delete cascade` to `personal_transactions` and `personal_categories`; backfill via `owner_id = user_id`; then set `not null` + add indexes.
  - [ ] Alter `personal_transactions.user_id` FK: drop the existing `on delete cascade`, re-add as `on delete set null` and make the column nullable. Preserves a wallet's transaction history when a creator's account/membership is later removed, per product decision — a transaction belongs to the wallet, not to its creator.
  - [ ] Create `wallet_shares` (`id` uuid pk, `account_id` uuid not null → `personal_accounts(id)` on delete cascade, `shared_with_user_id` uuid not null → `auth.users(id)` on delete cascade, `permission_level` text not null check in (`'view'`,`'edit'`) default `'view'`, `created_at`). Add `unique(account_id, shared_with_user_id)`; index on `shared_with_user_id`.
  - [ ] Security-definer helper `public.is_account_member(p_account_id uuid) returns boolean` — true if caller is owner OR has a `wallet_shares` row. **Must be `security definer` to break RLS recursion** between `personal_accounts` and `wallet_shares` policies.
  - [ ] Security-definer helper `public.can_edit_account(p_account_id uuid) returns boolean` — true if owner OR share with `permission_level = 'edit'`.
  - [ ] Security-definer RPC `public.find_user_by_email(p_email text) returns table(id uuid, username text)` — resolves an invite email to a user (profiles SELECT is locked to own row, so a definer function is required). Grant execute to `authenticated`. Document the address-enumeration tradeoff in a `--` comment (acceptable: invite requires an exact email; small trusted app).
  - [ ] Rewrite RLS:
    - `personal_accounts`: SELECT `using (is_account_member(id))`; INSERT `with check (owner_id = auth.uid())`; UPDATE/DELETE owner-only.
    - `personal_transactions`: drop old owner-only policies. SELECT `using (is_account_member(account_id))`; INSERT `with check (can_edit_account(account_id) and user_id = auth.uid())`; UPDATE `using (can_edit_account(account_id))`.
    - `personal_categories`: same pattern (SELECT member, INSERT `can_edit_account`).
    - `wallet_shares`: SELECT if caller is account owner OR `shared_with_user_id = auth.uid()`; INSERT/DELETE owner-only (owner check via `is_account_member`-style owner subquery, not the member helper).
  - [ ] Reuse existing `get_all_usernames()` RPC (migration 011) for member/creator name lookups — no new function needed for names.

### 2. Types — `src/modules/wallet/types.ts`
- [ ] **[src/modules/wallet/types.ts]** — add:
  - `SharePermission = 'view' | 'edit'`
  - `PersonalAccount = { id; name; ownerId }`
  - `WalletRole = 'owner' | 'partner'`
  - `WalletMember = { userId; username; role: WalletRole; permission: SharePermission | null }`
  - `AccessibleWallet = { account: PersonalAccount; role: WalletRole; permission: SharePermission }`
  - Extend `PersonalTransaction` with `createdBy: string | null` and `creatorName: string | null` (both null once a creator's account is removed — transaction itself is preserved).

### 3. Service layer — `src/modules/wallet/services.ts`
- [ ] **[src/modules/wallet/services.ts]** — refactor from user-scoped to account-scoped; `crypto.ts` untouched:
  - [ ] `ensureDefaultAccount(userId): Promise<PersonalAccount>` — return the user's owned account, creating one if missing (covers users created after backfill).
  - [ ] `getAccessibleWallets(userId): Promise<AccessibleWallet[]>` — owned account(s) (role `owner`, permission `edit`) plus wallets from `wallet_shares` where `shared_with_user_id = userId` (role `partner`, permission from row). Names resolved for shared owners.
  - [ ] `getSharedWallets(userId)` — required by spec; the shared-only subset of the above (wallets shared *with* the user).
  - [ ] `getWalletMembers(accountId): Promise<WalletMember[]>` — owner + all `wallet_shares` rows for the account, usernames mapped via `get_all_usernames()` RPC.
  - [ ] `inviteUserToWallet(accountId, email, permission)` — resolve email via `find_user_by_email` RPC; reject if not found, if inviting self, or if already a member (upsert-or-error on the `unique` constraint); insert `wallet_shares` row. Returns a typed result, not a throw, for form UX.
  - [ ] `revokeWalletShare(accountId, sharedWithUserId)` — delete the share (owner-gated by RLS).
  - [ ] Change `getPersonalTransactions`, `getWalletSummary`, `getCategoryBreakdown`, `getUserCategories`, `addUserCategory` to take **`accountId`** and filter `.eq('account_id', accountId)` instead of `user_id`.
  - [ ] `getPersonalTransactions`: also select `user_id`, map to `createdBy`, and resolve `creatorName` via `get_all_usernames()`.
  - [ ] `addPersonalTransaction(accountId, createdBy, amount, type, category, description)` — insert with both `account_id` and `user_id = createdBy`.
  - [ ] `addUserCategory` — write `account_id`; duplicate check stays against decrypted values (per migration 012 note).

### 4. UI components — `src/modules/wallet/components/`
- [ ] **[src/modules/wallet/components/ShareWalletPanel.tsx]** (new, `'use client'`) — collapsible panel/modal:
  - Email input + permission select (Read-only / Full Access) + submit, driven by `useTransition`; inline error/success text.
  - Member list: each row shows initials avatar + username + neon role badge — Owner = `bg-brand/10 text-brand-light`, Partner = `bg-accent/10 text-accent-light`; permission sub-label (`Chỉ xem` / `Toàn quyền`) as a `neon-yellow`/`neon-green` micro-badge.
  - Revoke button per partner, owner-only (`onRevokeShare`), hidden when the current user is not the owner.
  - Follows `ui-design-system.md` (surface/border/ink tokens, `font-orbitron` heading, no raw hex).
- [ ] **[src/modules/wallet/components/WalletSwitcher.tsx]** (new, `'use client'`) — pill/tab list of `accessibleWallets`; navigates to `/my-wallet?wallet=<id>` (uses `next/navigation` router, not Supabase). Active pill uses `border-brand-glow`; each shows an Owner/Partner role tag.
- [ ] **[src/modules/wallet/components/WalletDashboard.tsx]** — extend props: `accessibleWallets`, `selectedAccount`, `members`, `currentUserId`, `permission`, `onShareWallet`, `onRevokeShare`. Render `<WalletSwitcher>` in the header and `<ShareWalletPanel>` in the layout. In `TransactionRow`, append a small initials chip + `Created by {creatorName}` line (muted). **Gate `QuickAddForm` behind `permission === 'edit'`** — read-only members see a "Bạn chỉ có quyền xem ví này" notice instead of the form.

### 5. Page integration — `src/app/my-wallet/page.tsx`
- [ ] **[src/app/my-wallet/page.tsx]** — make account-aware:
  - [ ] After `getCurrentUser()`, `await ensureDefaultAccount(user.id)` and `getAccessibleWallets(user.id)`.
  - [ ] Resolve `selectedAccountId` from `searchParams.wallet`, **validating it is in the accessible set** (fall back to the owned account otherwise — never trust the query param).
  - [ ] Fetch summary/transactions/breakdown/categories for `selectedAccountId`, plus `getWalletMembers(selectedAccountId)`; derive `permission` for the current user.
  - [ ] Update `handleAddTransaction`/`handleAddCategory` to accept `accountId`, re-validate `getUser()` + membership/edit-permission server-side before mutating (do not rely on RLS alone for the error message), pass `user.id` as creator.
  - [ ] New inline `handleShareWallet(accountId, email, permission)` — `'use server'`: `getUser()`, verify caller owns `accountId`, call `inviteUserToWallet`, `revalidatePath('/my-wallet')`, return typed `{ error? }`.
  - [ ] New inline `handleRevokeShare(accountId, userId)` — `'use server'`: `getUser()` + owner check, `revokeWalletShare`, `revalidatePath('/my-wallet')`.
  - [ ] Pass all new props into `<WalletDashboard>`.

---

## Assumptions (confirmed)
- **Wallet model — confirmed:** introducing `personal_accounts` is required (no wallet entity exists today); "wallet_id/account_id" in the request maps to `personal_accounts.id`.
- **Revoke behavior — confirmed:** preserve transactions on member/account removal (`on delete set null`, not cascade).
- **Invite scope — confirmed:** registered users only; no pending-invite/email-send flow.
- Each user has exactly one owned wallet (auto-created); multi-wallet-per-user ownership is out of scope.
- Selected wallet is passed via `?wallet=<id>` on `/my-wallet` (Server Component reads `searchParams`); no client global state.
- Wallet `name` is plaintext (not financial data), so it is not encrypted — unlike amount/category/description.
- `permission_level` values are `'view'` and `'edit'`, surfaced in UI as Read-only / Full Access.
- Invites target existing registered users only (email resolved via RPC); inviting a non-registered email returns an error rather than creating a pending/email invite.
- `WALLET_ENCRYPTION_KEY` and `crypto.ts` are unchanged; decryptability by members is achieved via RLS + the shared global key.
- Existing `get_all_usernames()` RPC is reused for member/creator names (no widening of `profiles` SELECT policy).

## Risks
- **Module isolation:** none violated — all TS changes stay in `modules/wallet` + `app/my-wallet`; cross-module needs (usernames) are met via existing DB RPCs, not TS imports. No `src/shared/` extraction required.
- **New Supabase migration:** yes (015). Backfill of `account_id` runs before the `not null` constraint; verify no orphan rows. Encrypted columns are untouched (only a new FK column added) — no re-encryption needed.
- **RLS recursion:** `personal_accounts` ↔ `wallet_shares` policies can recurse; mitigated by `security definer` helper functions (`is_account_member`, `can_edit_account`) that bypass RLS. Must be tested.
- **RLS policy changes:** the existing owner-only `personal_transactions`/`personal_categories` policies are dropped and replaced — regression risk for the single-user flow; verify a non-shared user still has full access to their own wallet.
- **Cascade on creator deletion — resolved:** `personal_transactions.user_id` is changed to `on delete set null` (nullable) so a wallet's transaction history survives a partner's account being removed or their membership revoked; `revokeWalletShare` itself never touches `personal_transactions` since shares aren't FK'd to transactions.
- **Server/client boundary:** new components are `'use client'`; they must receive data + action refs from the page and never import `services.ts`/`crypto.ts` (Node `crypto` breaks the client bundle).
- **Auth/middleware:** `/my-wallet` is already protected in `PROTECTED_PREFIXES`; shared viewing stays under `/my-wallet?wallet=`, so no middleware change. All Server Actions re-validate with `getUser()` + membership.
- **Email enumeration:** `find_user_by_email` reveals whether an email is registered. Acceptable for this app; noted in the migration.
