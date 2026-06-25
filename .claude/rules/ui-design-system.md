# UI Design System — MuzikSkul

**Theme:** Dark cyberpunk / social entertainment hub.
**Source of truth:** `tailwind.config.ts` (color tokens, fonts, shadows) and `src/app/globals.css` (base layer).

Every new UI component must use the tokens defined here. Never hardcode hex values or use arbitrary Tailwind values (`text-[#fff]`) for design-system colours — always use the named token.

---

## Colour tokens

### Surfaces — background hierarchy

| Token | Class | Hex | Use for |
|---|---|---|---|
| `surface.base` | `bg-surface-base` | `#09090f` | Page / `<body>` background |
| `surface.card` | `bg-surface-card` | `#13131f` | Cards, panels, sidebars |
| `surface.elevated` | `bg-surface-elevated` | `#1c1c2e` | Modals, dropdowns, tooltip bg, hover state overlay |
| `surface.border` | `border-surface-border` | `#252538` | Dividers, default card borders, input borders |

**Rule:** never use `bg-white`, `bg-gray-*`, or `bg-black` for layout surfaces — always use the surface scale.

### Brand — primary violet/purple

| Token | Class | Hex | Use for |
|---|---|---|---|
| `brand` | `bg-brand`, `text-brand`, `border-brand` | `#7c3aed` | Primary CTAs, active states, focus rings |
| `brand.light` | `text-brand-light` | `#a78bfa` | Brand text on dark surfaces |
| `brand.dark` | `bg-brand-dark` | `#5b21b6` | Pressed/active button states |
| `brand.glow` | `shadow-brand-glow` | rgba | Glow effect on brand elements |

### Accent — electric cyan

| Token | Class | Hex | Use for |
|---|---|---|---|
| `accent` | `bg-accent`, `text-accent`, `border-accent` | `#06b6d4` | Secondary highlights, links, data visualisation |
| `accent.light` | `text-accent-light` | `#67e8f9` | Accent text on dark backgrounds |
| `accent.glow` | `shadow-accent-glow` | rgba | Glow on accent elements |

### Semantic / neon

| Token | Class | Use for |
|---|---|---|
| `neon.green` | `text-neon-green`, `bg-neon-green` | Success, approved, online |
| `neon.yellow` | `text-neon-yellow` | Warning, pending, caution |
| `neon.red` | `text-neon-red` | Error, rejected, destructive |

### Text (ink scale)

| Token | Class | Use for |
|---|---|---|
| `ink.primary` | `text-ink-primary` | Headings, labels, strong content |
| `ink.secondary` | `text-ink-secondary` | Body text, descriptions (default body colour) |
| `ink.muted` | `text-ink-muted` | Placeholders, disabled text, timestamps |

---

## Typography

Two fonts are loaded globally via CSS variables. Apply them with the Tailwind utility:

| Font | Class | Weight | Use for |
|---|---|---|---|
| **Orbitron** | `font-orbitron` | 700, 900 | Page titles (`h1`, `h2`), brand wordmark, section headers |
| **JetBrains Mono** | `font-jetbrains` | 400, 500 | Numbers (amounts, counts), code, account numbers, IDs |
| System sans-serif | *(default)* | any | Body copy, labels, button text, descriptions |

**Rules:**
- `h1`–`h6` automatically use `font-orbitron text-ink-primary` via `globals.css`.
- Use `font-jetbrains` for any numeric/monospaced data: currency, account numbers, stats, transaction IDs.
- Body text and UI labels use the system font stack — no Orbitron for prose.

---

## Shadows & glow effects

| Class | Use for |
|---|---|
| `shadow-card` | Default resting state for cards |
| `shadow-card-hover` | Card on hover (`hover:shadow-card-hover`) |
| `shadow-brand-glow` | Buttons, badges, borders with brand accent |
| `shadow-accent-glow` | Cyan-accented interactive elements |
| `border-brand-glow` | Custom utility — brand border + inner glow |
| `border-accent-glow` | Custom utility — accent border + inner glow |

---

## Background gradients

| Class | Use for |
|---|---|
| `bg-brand-gradient` | Hero sections, CTAs, gradient text backgrounds |
| `bg-surface-gradient` | Subtle depth on tall panels |

---

## Component patterns

### Card

```tsx
<div className="rounded-xl border border-surface-border bg-surface-card shadow-card transition-shadow hover:shadow-card-hover">
  {/* content */}
</div>
```

### Elevated card (modal, popover)

```tsx
<div className="rounded-xl border border-surface-border bg-surface-elevated shadow-card">
  {/* content */}
</div>
```

### Primary button

```tsx
<button className="rounded-lg bg-brand px-4 py-2 font-semibold text-ink-primary transition hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-surface-base disabled:opacity-50">
  Label
</button>
```

### Secondary / ghost button

```tsx
<button className="rounded-lg border border-surface-border px-4 py-2 text-ink-secondary transition hover:border-brand hover:text-brand-light">
  Label
</button>
```

### Status badge

```tsx
// Approved / success
<span className="inline-flex items-center gap-1.5 rounded-full bg-neon-green/10 px-2.5 py-1 text-xs font-semibold text-neon-green">
  <span className="h-1.5 w-1.5 rounded-full bg-neon-green" />
  Đã duyệt
</span>

// Pending / warning
<span className="inline-flex items-center gap-1.5 rounded-full bg-neon-yellow/10 px-2.5 py-1 text-xs font-semibold text-neon-yellow">
  <span className="animate-ping absolute h-1.5 w-1.5 rounded-full bg-neon-yellow opacity-75" />
  <span className="relative h-1.5 w-1.5 rounded-full bg-neon-yellow" />
  Chờ duyệt
</span>
```

### Section heading

```tsx
<div className="mb-6">
  <h1 className="font-orbitron text-2xl font-bold text-ink-primary">Page Title</h1>
  <p className="mt-1 text-sm text-ink-secondary">Subtitle or description</p>
</div>
```

### Data / currency value

```tsx
// Large stat
<p className="font-jetbrains text-4xl font-bold text-ink-primary">4.250.000 ₫</p>

// Table cell amount
<span className="font-jetbrains font-medium text-ink-primary">500.000 ₫</span>
```

### Page shell

```tsx
<main className="min-h-screen bg-surface-base">
  <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
    {/* content */}
  </div>
</main>
```

---

## Do / don't

| Do | Don't |
|---|---|
| `bg-surface-card` | `bg-gray-900`, `bg-zinc-900`, `bg-[#13131f]` |
| `text-ink-secondary` | `text-gray-400` |
| `border-surface-border` | `border-gray-700` |
| `text-brand-light` | `text-purple-400` |
| `text-neon-green` | `text-green-500` |
| `font-orbitron` for headings | `font-bold` alone on headings |
| `font-jetbrains` for amounts | default font for currency values |
| Glow shadows via `shadow-brand-glow` | `drop-shadow` with raw colours |
| Semantic `bg-neon-green/10` for badge bg | `bg-green-900/30` |

---

## Adding to the design system

If a new token is genuinely needed (a new surface level, a new brand colour):
1. Add it to `tailwind.config.ts` under `theme.extend.colors` or `boxShadow`.
2. Update this rule file with the token name, class, hex, and usage note.
3. Never use a one-off arbitrary value — if it appears more than once, it belongs in the config.
