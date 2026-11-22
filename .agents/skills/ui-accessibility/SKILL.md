---
name: ui-accessibility
description: Accessibility (WCAG 2.2 AA) requirements and testing for the VoiceApp UI - semantics, keyboard, focus, ARIA live regions, contrast, motion, forms, and accessible audio/call controls including deaf and hard-of-hearing considerations. Use when building or reviewing any UI, adding interactive components, or before a release.
---

# UI Accessibility

Target **WCAG 2.2 AA**. Accessibility is a stated project requirement, and captions/clear status indicators help everyone (including hard-of-hearing users and people in noisy places). Call-specific details live in `call-room-ui`; this is the general standard.

## Semantics first
- Use real elements: `button`, `a`, `label`, `input`, `select`, `dialog`, `nav`, `main`, `header`, `h1-h6`. One `<h1>` per page; headings in order.
- Landmarks: `<header>`, `<nav aria-label>`, `<main id="main">`, plus a "Skip to main content" link.
- Set `<html lang="en">` and `lang="ml"` / `lang="ta"` on Malayalam/Tamil text so screen readers pronounce it correctly.
- Page title changes on route change; move focus to the page `<h1>` (or `main`) after navigation in the SPA.

## Keyboard
- Everything operable by keyboard in a logical order; no keyboard traps (modals trap *and* release focus; Esc closes).
- Visible focus on every interactive element: `focus-visible:ring-2 ring-brand-500 ring-offset-2` (v4: `outline-hidden` only with a replacement style).
- Custom shortcuts (e.g. `M` to mute) are off while typing in fields and are documented in the UI.

## Names, roles, states
- Icon-only buttons: `aria-label` states the action ("Mute microphone"), toggles use `aria-pressed` (and keep the label stable, or change label and omit pressed - not both contradicting).
- Inputs always have a visible `<label>`; placeholder is not a label. Hints and errors linked via `aria-describedby`; invalid fields `aria-invalid="true"`; required fields marked in text, not color alone.
- Decorative icons `aria-hidden="true"`.

## Dynamic updates
- `role="status"` / `aria-live="polite"` for connection, translation status, and captions; `role="alert"` for blocking errors. Don't announce every partial caption update - announce finalized segments, and let users turn captions off.
- Don't move focus unexpectedly; do move it to a new dialog, an error summary, or the first invalid field.
- Loading: `aria-busy` on the region and a text alternative for spinners.

## Visual
- Contrast: text 4.5:1, large text and UI components/icons 3:1; focus indicator 3:1. Check muted text and disabled-looking states on dark surfaces.
- Never convey state by color alone (red/green connection dots need an icon and label).
- Support zoom to 200% and text resize without loss; reflow at 320px width; no fixed-height text containers.
- Target size >= 24x24 CSS px minimum (WCAG 2.2), aim for 44x44 for touch.
- Honor `prefers-reduced-motion` (`motion-reduce:` variants): remove non-essential animation, keep static indicators for speaking/processing.

## Audio-specific
- Provide non-audio equivalents of audio status: visible speaking indicator, translation-in-progress state, optional captions of what is being translated.
- Never autoplay audio without a user gesture; provide volume/mute and an obvious way to stop translated playback.
- Audio-source labels are text, not only icons.
- Don't rely on sound-only cues (e.g. "user joined" chime) - pair with visual/announced status.

## Forms
Autocomplete tokens (`email`, `current-password`, `new-password`, `name`), correct `type`/`inputMode`, error summary at top on submit failure, errors written as instructions, no timeouts that erase input.

## Test routine (before marking UI work done)
1. Keyboard-only walkthrough of the flow.
2. Zoom 200% and 320px width.
3. Screen reader spot-check (NVDA on Windows with Chrome/Firefox; VoiceOver on iOS Safari for mobile).
4. Axe/Lighthouse accessibility scan (dev-tools extension or `@axe-core/react` in dev only) - fix all serious/critical.
5. Reduced-motion and high-contrast (forced colors) check.
6. Contrast check for any new color pairing.
Automated tools catch ~30-40% of issues; the manual steps matter.
