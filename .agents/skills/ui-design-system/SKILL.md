---
name: ui-design-system
description: VoiceApp visual design system on Tailwind CSS v4 - design tokens in @theme, color roles (including original-vs-translated audio colors), typography with Malayalam/Tamil fallbacks, spacing, radius, elevation, dark/light theming, icons. Use when choosing colors, fonts, spacing or styling any new screen, or when setting up or changing index.css theme tokens.
---

# UI Design System (Tailwind v4)

Goal: a calm, trustworthy, modern voice-communication product. People are mid-conversation and often stressed by tech: the UI must be quiet, legible and predictable. Design tokens first, then components; never sprinkle one-off hex values.

## Where tokens live
All tokens go in `frontend/src/index.css` using Tailwind v4 CSS-first config - **no `tailwind.config.js`**:
```css
@import 'tailwindcss';

@theme {
  --font-sans: 'Inter', 'Noto Sans Malayalam', 'Noto Sans Tamil', system-ui, sans-serif;

  --color-brand-500: oklch(0.62 0.19 265);
  --color-brand-600: oklch(0.55 0.2 265);
  /* surfaces, text, status, audio roles ... */
}
```
Tokens become utilities automatically (`bg-brand-500`, `text-ink-muted`). Inspect existing `index.css` and the current `bg-slate-950` dark look first; extend, don't replace.

## Color roles (name by role, not by hue)
| Role | Purpose |
|---|---|
| `surface` / `surface-raised` / `surface-overlay` | page, cards, modals (dark-first: slate-950 / 900 / 800) |
| `ink` / `ink-muted` / `ink-faint` | primary, secondary, disabled/hint text |
| `border` / `border-strong` | dividers, input borders |
| `brand` (500/600/700) | primary actions, focus ring, active states |
| `success` / `warning` / `danger` / `info` | status - always paired with an icon + text |
| `audio-original` / `audio-translated` / `audio-ai` | consistent identity for the three audio kinds shown in the call UI (e.g. neutral gray, brand/teal, violet). Same color wherever those badges appear. |

Rules:
1. Text contrast >= 4.5:1 (3:1 for large text and UI boundaries/icons). Verify, don't eyeball - especially muted text on dark surfaces.
2. Color is never the only signal (mute, error, connection state need icon + label).
3. One primary action per view; secondary actions are neutral/outlined; destructive actions use `danger` and ask for confirmation.
4. Keep the palette small: 1 brand, 4 status, neutrals. Resist adding accent colors.

## Theming
Ship dark-first (matches current app) and design light as a token swap, not a rewrite. For class-based switching in v4 add `@custom-variant dark (&:where(.dark, .dark *));`; respect `prefers-color-scheme` by default and persist an explicit user choice. Use semantic tokens (`bg-surface`) so components don't need `dark:` everywhere.

## Typography
- Sans: Inter + Noto Sans Malayalam + Noto Sans Tamil fallbacks so both first-pair scripts render; add more script fonts as languages are enabled (see `ux-multilingual-content`). Self-host fonts (`@fontsource`) or load with `font-display: swap`; subset where possible.
- Scale: `text-xs 12 / sm 14 / base 16 / lg 18 / xl 20 / 2xl 24 / 4xl 36`. Body never below 14px; inputs 16px (prevents iOS zoom).
- Weights: 400 body, 500 labels/buttons, 600-700 headings. Line-height ~1.5 body, ~1.25 headings; Malayalam and Tamil need generous line-height (>= 1.6) because glyphs have tall/deep marks.
- Max line length ~65ch for prose (privacy/consent text).

## Spacing, shape, elevation
- 4px base grid (Tailwind scale). Use 4/8/12/16/24/32/48; keep related items tight (8-12) and sections apart (24-48).
- Radius: `rounded-lg` controls, `rounded-xl`/`2xl` cards and modals, `rounded-full` avatars/badges/mute button.
- Elevation: prefer borders + subtle surface change in dark mode over heavy shadows; modals get `surface-overlay` + backdrop `bg-black/60`.
- Touch targets >= 44x44px.

## Icons
`lucide-react` only; 16/20/24px; `strokeWidth` 1.75-2; decorative icons `aria-hidden`, icon-only buttons need an accessible name. Don't mix icon libraries.

## Tailwind v4 gotchas
- `outline-none` -> use `outline-hidden` (and always supply a visible `focus-visible` style).
- Default `ring` is 1px; use `ring-2`/`ring-3` explicitly.
- Renamed scale: `shadow-sm`->`shadow-xs`, `rounded-sm`->`rounded-xs` (old `shadow`/`rounded` bare names shifted). Check against docs when migrating snippets from v3 examples.
- Use `min-h-dvh` instead of `min-h-screen`/`100vh` for mobile browser chrome.
- Dynamic class names built by string concatenation are not detected - use full literal class strings or a lookup map.
- Prefer `size-*`, `gap-*`, `inline-flex`, and logical utilities.

## Done when
No raw hex/rgb in components; every color/space/radius comes from tokens or the Tailwind scale; contrast checked for text and controls in the dark theme (and light if shipped).
