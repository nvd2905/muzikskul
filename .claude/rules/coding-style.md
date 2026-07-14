# Coding Style Rules

## TypeScript

- Strict mode is on — no `any`, no implicit `any`.
- No non-null assertions (`!`) without a comment explaining why it's safe.
- Export types from `services.ts` and reuse them in components — don't re-declare the same shape.
- Prefer `type` over `interface` for object shapes.
- `const` over `let`; `let` only when reassignment is necessary.

## React / Next.js

- Server Components are the default — add `'use client'` only when needed (event handlers, browser APIs, hooks that require client state).
- Component names: PascalCase (`FundTable`, `StatusBadge`).
- File names: match the exported component name (`FundTable.tsx`).
- One component per file for named exports; small private helpers in the same file are fine.
- Use `useTransition` for Server Action calls from Client Components — provides `isPending` state without blocking the UI thread.
- Never call Supabase from a Client Component — pass data and action refs from the Server Component.

## Number inputs

- Any input collecting a money amount (VNĐ) must show thousand-separator formatting as the user types — never a raw `type="number"` field for currency. Use `MoneyInput` from `src/shared/components/MoneyInput.tsx` (`type="text"` + `inputMode="numeric"`, formats with `Intl.NumberFormat('vi-VN')` on every keystroke).
- Match the `vi-VN` period separator (`1.800.000`) used everywhere amounts are displayed (`formatVND` helpers) — don't introduce `en-US` commas, which would look inconsistent with the rest of the UI.
- The controlled state for a `MoneyInput` holds the *formatted* string, not raw digits (mirrors what `formatVND`-adjacent components already did before this component existed). Parse it back to a number with `parseMoneyInput` from the same file — never `parseInt(value, 10)` directly, since the formatted string contains `.` separators.
- Non-currency numeric inputs (gold chỉ quantity, percentages, etc.) are unaffected — this rule is scoped to money amounts.

## Tailwind CSS

- Tailwind utility classes only — no `style={{}}` inline styles, no CSS modules.
- Responsive variants where needed (`sm:`, `md:`, etc.).
- Dynamic class strings: use a ternary or template literal — never string-concatenate partial class names that Tailwind can't statically detect.
  ```tsx
  // Good
  className={`rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}

  // Bad — Tailwind can't purge 'bg-' + color
  className={`rounded-full bg-${color}-100`}
  ```

## File organisation

```
src/app/<route>/page.tsx          # async Server Component
src/modules/<module>/services.ts  # Supabase queries + exported types
src/modules/<module>/components/  # 'use client' components
src/shared/components/            # shared UI primitives
src/shared/hooks/                 # shared hooks
src/shared/utils/                 # pure utilities
src/supabase/client.ts            # browser Supabase client
src/supabase/server.ts            # server Supabase client
```

## Comments

- No comments that explain *what* the code does — well-named identifiers do that.
- Comments only for *why*: a hidden constraint, a workaround, a subtle invariant.
- No multi-line comment blocks or docstrings.

## Naming

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `FundTable` |
| Functions / variables | camelCase | `formatVND`, `isPending` |
| Constants | camelCase (or SCREAMING_SNAKE for true compile-time consts) | `FUND_ID` |
| DB table names | snake_case | `class_transactions` |
| DB column names | snake_case | `payer_name` |
| TypeScript type fields | camelCase (mapped from DB) | `payerName` |
| Files | match export name | `FundTable.tsx`, `services.ts` |
