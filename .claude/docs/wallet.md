# `wallet` module

Personal income/expense tracker at `/my-wallet` (protected route). `amount`, `category`, and `description` are encrypted at rest.

## Features

- **Summary at a glance** — current balance, total income, and total expense in three stat cards; balance turns red if negative.
- **Expense breakdown by category** — a bar-per-category view of where expense money went, each with its share of total expenses as a percentage.
- **Quick-add transaction** — a single form to log an income or expense with amount, category, and an optional description.
- **Custom categories** — beyond the five built-ins (Food, Study, Transport, Entertainment, Others), users can add their own categories inline while adding a transaction; duplicates (case-insensitive) are silently ignored.
- **Transaction history** — a reverse-chronological list of every logged transaction with category and date.
- **Private by design** — every transaction's amount, category, and description are encrypted before they reach the database, so even someone with direct table/dashboard access sees ciphertext, not a member's real spending.

## Files

- `src/modules/wallet/services.ts` — Supabase queries; encrypts/decrypts at the read/write boundary.
- `src/modules/wallet/crypto.ts` — AES-256-GCM helpers, keyed from `WALLET_ENCRYPTION_KEY`. Only import this from `services.ts` (uses Node's `crypto`, breaks the client bundle if pulled into a `'use client'` component).
- `src/modules/wallet/types.ts` — shared types + `TRANSACTION_CATEGORIES` built-in defaults.
- `src/modules/wallet/components/WalletDashboard.tsx` — client component.
- `src/app/my-wallet/page.tsx` — Server Component; redirects to `/login` if unauthenticated (belt-and-suspenders alongside middleware).

## Types (`types.ts`)

```ts
type TransactionType = 'income' | 'expense'
type TransactionCategory = string
const TRANSACTION_CATEGORIES: TransactionCategory[] = ['Food', 'Study', 'Transport', 'Entertainment', 'Others']
type PersonalTransaction = { id: string; amount: number; type: TransactionType; category: TransactionCategory; description: string | null; createdAt: string }
type WalletSummary = { totalIncome: number; totalExpense: number; balance: number }
type CategoryBreakdown = { category: TransactionCategory; total: number; percentage: number }
```

`services.ts` re-exports everything from `types.ts` (`export * from './types'`) — import types from `services.ts` in components, not directly from `types.ts`.

## Public API (`services.ts`)

| Export | Notes |
|---|---|
| `getPersonalTransactions(userId)` | Decrypts `amount`/`category`/`description` per row. |
| `getWalletSummary(userId)` | Sums decrypted amounts client-side (can't sum ciphertext in SQL) into `{ totalIncome, totalExpense, balance }`. |
| `getCategoryBreakdown(userId)` | Expense-only, grouped by decrypted category, with `percentage` of grand total. |
| `getUserCategories(userId)` | Reads `personal_categories`, decrypts `name`. These are added on top of `TRANSACTION_CATEGORIES`. |
| `addUserCategory(userId, name, existing)` | Case-insensitive dedupe against `existing` before insert; encrypts `name`. |
| `addPersonalTransaction(userId, amount, type, category, description)` | Encrypts `amount` (stored as string), `category`, and optional `description` before insert. |

## Encryption (`crypto.ts`)

- `encryptField(value)` / `decryptField(payload)`, AES-256-GCM.
- Key derivation: `scryptSync(WALLET_ENCRYPTION_KEY, 'muzikskul-wallet-v1', 32)`, cached in module scope (`cachedKey`) after first use.
- Payload format: `${iv_b64}.${authTag_b64}.${ciphertext_b64}`; a fresh random IV per encryption.
- Throws `'WALLET_ENCRYPTION_KEY is not set'` if the env var is missing, and `'Invalid encrypted payload'` if a stored value doesn't split into exactly 3 parts.
- **Losing `WALLET_ENCRYPTION_KEY` permanently loses all encrypted rows** — treat it like a database credential, back it up outside the repo.

## Rules specific to this module

- Encryption never leaks past `services.ts` — components and Server Actions in `src/app/my-wallet/page.tsx` only ever see plaintext values.
- `amount` is encrypted as a string (`encryptField(String(amount))`) and decrypted back through `Number(...)` — any new numeric field added to this table should follow the same string round-trip, since `encryptField` takes `string`.
- Category validation (`handleAddTransaction`, `handleAddCategory` in `page.tsx`) always re-fetches `getUserCategories` server-side before validating against `[...TRANSACTION_CATEGORIES, ...customCategories]` — don't trust a category list passed from the client as the validation source.
