# `gold-price` module

Domestic gold price dashboard. Viewable without auth (not in `PROTECTED_PREFIXES`), with an inline sign-in CTA on the page.

## Features

- **Live domestic gold prices** — a hero card for SJC (buy/sell price, 24h change, live-pulse indicator) plus a full table of every tracked gold type (SJC, 999, 9999, PNJ, DOJI, Bảo Tín Minh Châu, Đỗ Hoành), auto-refreshing every 60s via ISR and manually refreshable with a button.
- **24h SJC price chart** — an inline SVG sparkline (buy vs. sell lines with gradient fill) built from `getSJCHistory24h()`, no charting library dependency.
- **Personal gold savings tracker ("Tích chỉ cá nhân")** — logged-in users can log individual gold purchases (date, gold type, amount in *chỉ*, price paid), set an accumulation target, and see live profit/loss against current prices. **Purchase data is stored in the browser's `localStorage`, not Supabase** — it's per-device only, not synced across devices or persisted server-side.
- **Sign-in gate for the tracker only** — the price dashboard itself is fully public; only opening the savings tracker prompts a Discord login modal.

## Files

- `src/modules/gold-price/services.ts` — fetches from an external REST API (not Supabase).
- `src/modules/gold-price/components/GoldPriceDashboard.tsx` — main dashboard client component.
- `src/modules/gold-price/components/GoldSavingsTracker.tsx` — savings tracker client component.
- `src/app/gold-price/page.tsx` — Server Component.

## Public API (`services.ts`)

Data source: `https://api.mihong.vn/v1` (third-party, not Supabase — the one module that doesn't query the app's own database for its primary data).

| Export | Notes |
|---|---|
| `getDomesticGoldPrices()` | `GET /gold-prices?market=domestic`. Cached via `next: { revalidate: 60 }` (60s ISR). |
| `getSJCHistory24h()` | `GET /gold-prices?market=domestic&goldCode=SJC&last=24h`. Cached via `next: { revalidate: 300 }` (5min ISR). |

```ts
type GoldPrice = {
  code: string; buyingPrice: number; sellingPrice: number
  sellChange: number; sellChangePercent: number
  buyChange: number; buyChangePercent: number; dateTime: string
}
type GoldPricePoint = { buyingPrice: number; sellingPrice: number; code: string; dateTime: string }
```

Both throw `Error` with the HTTP status on a non-OK response — callers should expect this to surface as a Server Component render error unless caught upstream.

## Rules specific to this module

- This module has no Supabase dependency for its core data — don't add one unless a genuinely new persisted feature (e.g. user price alerts) requires it, and if you do, keep the external-fetch functions and any Supabase functions clearly separated in `services.ts`.
- Respect the existing `revalidate` windows when adding new fetches against the same API — they're tuned to the API's actual update cadence (prices ~1min, history ~5min).
