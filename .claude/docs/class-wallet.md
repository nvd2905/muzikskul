# `class-wallet` module

Class fund management: balance tracking, Momo QR payment collection with member self-reported payments, admin approve/reject workflow, manual balance adjustment, and a top-donors leaderboard.

## Features

- **Fund balance card** — shows the class's current balance vs. a target budget, with a progress bar that turns yellow under 50% and green at 100%+.
- **Momo QR collection** — displays the class's Momo QR code and account number (with copy-to-clipboard) plus a suggested top-up amount, so members know how much and where to pay.
- **Self-reported payments** — any signed-in member can report "I paid this amount" (name defaults to their Discord/Google username) after transferring via Momo; it lands as a `pending` transaction awaiting admin confirmation.
- **Admin approve / reject** — admins see Approve/Reject buttons on pending rows; approving adds the amount to the fund balance, rejecting just marks the row without touching the balance.
- **Manual balance adjustment (admin only)** — admins can add or deduct funds directly (e.g. cash collected offline, an expense paid from the fund) with a name and reason, recorded as an already-approved transaction.
- **Top-3 donors leaderboard** — ranks members by total approved contributions, merging multiple payments from the same account into one total even if they typed their name differently each time.
- **Transaction history table** — filterable by status (all/pending/approved/rejected), searchable by payer name, paginated 10 rows at a time — all client-side, no reload.

## Files

- `src/modules/class-wallet/services.ts` — all Supabase queries + exported types.
- `src/modules/class-wallet/components/FundTable.tsx` — client component: status filter/search/pagination on the transactions table (client-side).
- `src/app/class-wallet/page.tsx` — Server Component; owns the inline Server Actions and `FUND_ID` constant.

Currently hardcoded to a single fund: `const FUND_ID = 'fund-002'` in `page.tsx`.

## Types (`services.ts`)

```ts
type FundStatus = { balance: number; className: string; targetBudget: number }
type Transaction = {
  id: string; amount: number; payerName: string
  status: 'pending' | 'approved' | 'rejected'
  invoice_url: string | null; note: string | null
  createdAt: string; userId: string | null
}
type TopDonor = { payerName: string; total: number }
```

## Public API (`services.ts`)

| Export | Notes |
|---|---|
| `getClassFundStatus(fundId)` | Reads `class_funds`. |
| `getClassTransactions(fundId)` | Reads `class_transactions`, newest first. |
| `getTopDonors(fundId, limit = 3)` | Only `status = 'approved'` and `amount > 0`. Groups by `user_id` when present (falls back to `name:${payerName}` key for rows with no linked profile, e.g. admin adjustments) so the same person's payments merge regardless of how they typed their name. Resolves display names via the `get_all_usernames()` RPC — **never** query `profiles` directly for another user's name (RLS blocks it; see Data model below). |
| `adjustFundBalance(fundId, delta, name, reason)` | Admin-only in practice (call `requireAdmin()` first). Inserts an already-`'approved'` transaction with no `user_id` (free-text `payer_name` only), then updates `class_funds.balance` by `delta`. |
| `reportPayment(fundId, amount, payerName, note, userId)` | Member self-report. Inserts a `'pending'` transaction; does **not** touch `class_funds.balance` — balance only changes on approval. |
| `rejectTransaction(transactionId)` | No-ops if the transaction isn't `'pending'`. Sets `status = 'rejected'`. |
| `approveTransaction(fundId, transactionId)` | No-ops if already `'approved'`. Sets `status = 'approved'` **and** adds `transaction.amount` to `class_funds.balance` — this is the only path (besides `adjustFundBalance`) that changes the balance. |

## Server Actions (`src/app/class-wallet/page.tsx`)

All four (`handleApprove`, `handleReject`, `handleReportPayment`, `handleAdjustBalance`) follow the same shape: call `requireAdmin()`/`getCurrentUser()` first, wrap in `try/catch`, map `'Unauthorized'`-prefixed errors to a Vietnamese-language `{ error }` string, call `revalidatePath('/class-wallet')` on success, return `{}`. Follow this exact pattern for any new mutation added to this page rather than inventing a new error-handling shape.

## Data model / RLS

- `class_funds`, `class_transactions` — RLS enabled (`005_enable_rls_class_wallet.sql`). Any authenticated user can read fund status/transactions and insert a `pending` transaction; only admins (via `profiles.role`) can update balance, approve/reject, or insert a pre-approved transaction.
- `class_transactions.status`: `'pending' | 'approved' | 'rejected'` (`009_add_rejected_status.sql`).
- `class_transactions.user_id` (nullable, FK → `profiles(id)`, `010_add_user_id_to_class_transactions.sql`): links a self-report to the reporting account for donor-total matching. Insert policy requires `user_id is null or user_id = auth.uid()` — a user cannot attribute a payment to someone else.
- `profiles` RLS only allows `auth.uid() = id` — reading another user's row (including via join) is blocked. The leaderboard resolves other users' display names exclusively through `get_all_usernames()`, a `security definer` RPC exposing only `id, username` (`011_add_get_all_usernames_rpc.sql`). **Never widen the `profiles` SELECT policy** to work around this — `profiles` also holds `email`.

## Rules specific to this module

- Balance changes only ever happen in `approveTransaction` and `adjustFundBalance` — if you add a new mutation that changes fund state, decide explicitly whether it should also touch `class_funds.balance`.
- Any new server action here must call `requireAdmin()` (admin mutation) or `getCurrentUser()` (member self-report) before touching data, mirroring the existing four.
