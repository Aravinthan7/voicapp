---
name: ui-component-patterns
description: Reusable React + Tailwind v4 component patterns for VoiceApp - typed Button/Input/Select/Card/Badge/Modal/Toast/Skeleton/Spinner components, form field pattern, variant handling, and accessible behavior. Use when building or extending components in components/common, components/layout, or components/call, or when a page needs a UI primitive.
---

# UI Component Patterns

Build a small in-house primitive set (no UI library that needs a global provider - project rule). Put primitives in `src/components/common/`, one file per component, named exports, PascalCase `.tsx`.

## Principles
1. **Typed props**: extend native element props (`React.ComponentPropsWithoutRef<'button'>`), use string-literal unions for variants (`erasableSyntaxOnly` forbids enums; `verbatimModuleSyntax` needs `import type`).
2. **Variants via lookup maps** of full class strings (Tailwind can't see dynamically concatenated names):
```tsx
const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-500',
  secondary: 'bg-surface-raised text-ink border border-border hover:border-border-strong',
  danger: 'bg-danger text-white hover:bg-danger/90',
  ghost: 'text-ink hover:bg-surface-raised',
} as const
type Variant = keyof typeof variants
```
3. Forward `className` and `ref` (React 19: `ref` is a normal prop); merge classes with a tiny `cx()` helper (don't add a dependency unless needed).
4. Every interactive element: visible `focus-visible` ring, hover, active, `disabled` (and `aria-busy` for loading), 44px min hit area.
5. Components are presentational. No API calls; no routing logic beyond `<Link>` composition.

## Primitive checklist
| Component | Must have |
|---|---|
| `Button` | variants, sizes, `loading` (spinner + disabled, keep width), optional leading icon, `type="button"` default |
| `IconButton` | required `label` prop -> `aria-label`; tooltip optional; toggle variant with `aria-pressed` (mute) |
| `TextField` | `<label htmlFor>`, hint, error (`aria-invalid`, `aria-describedby`), password show/hide, `autoComplete`, `inputMode` |
| `Select` | native `<select>` styled (best a11y/mobile); used for language choice |
| `Card` | surface, padding, optional header/footer slots |
| `Badge`/`StatusPill` | tone + icon + text (connection, audio source, voice status) |
| `Modal`/`ConfirmDialog` | native `<dialog>` or focus-trapped portal, `aria-modal`, Esc closes, restores focus, destructive confirm uses specific wording ("Delete my voice profile") |
| `Toast`/`InlineAlert` | `role="status"` (info) / `role="alert"` (errors); inline alerts preferred for form/call errors, toasts only for transient success |
| `Skeleton`, `Spinner` | skeleton for content layout, spinner for button/short waits; `aria-busy`, text alternative |
| `EmptyState` | icon, one-line explanation, one clear action |
| `Avatar` | initials fallback from display name |

## Form pattern
```tsx
// typed events, validation on blur + submit, server error in an aria-live region
const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault()
  const errors = validate(values)
  if (Object.keys(errors).length) { setErrors(errors); focusFirstInvalid(); return }
  setStatus('submitting')
  try { await authService.login(values); navigate(from) }
  catch (err) { setFormError(getErrorMessage(err)); setStatus('idle') }
}
```
- Disable submit only while pending (not while invalid - let users submit and see what's wrong).
- On error, move focus to the first invalid field or the error summary.
- Never clear what the user typed on failure (except passwords where appropriate).
- Language selects: show native names ("മലയാളം", "தமிழ்") alongside English; validate supported pair before enabling "Start call" and explain why if not.

## State coverage
Every data-driven component renders: loading (skeleton), error (message + retry), empty (EmptyState), success. Write them before polishing the happy path.

## Avoid
Prop sprawl (use composition/slots), boolean-prop explosions (use a `variant`), `useEffect` for derived state, inline `style` for design values, `div` with `onClick` (use `button`), duplicated markup across pages (extract), importing from `lucide-react` with dynamic names.

## Verify
Tab through the component; Space/Enter activate; screen-reader name is meaningful; works at 320px; `npm run build && npm run lint` clean.
