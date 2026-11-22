---
name: ui-layout-responsive
description: Layout, app shell and responsive design for the VoiceApp web UI - mobile-first breakpoints, page templates for auth, dashboard, voice profile and call room, mobile browser quirks (dvh, safe areas, audio autoplay), and orientation handling. Use when composing a page, building layout components, or fixing responsive issues.
---

# Layout & Responsive Design

The scope requires desktop **and** mobile browsers (native apps are out of scope), so mobile web is a first-class target, not an afterthought. Design at 360px first, then scale up.

## Breakpoints (Tailwind defaults)
Base (<640) phone portrait | `sm` 640 | `md` 768 tablet | `lg` 1024 laptop | `xl` 1280. Write unprefixed styles for mobile, add `md:`/`lg:` for larger. Test at 320, 360, 390, 768, 1024, 1440 and with browser zoom 200%.

## App shell (`components/layout/`)
- `AppShell`: header (logo, language badge, user menu) + `<main>`; a centered container `mx-auto w-full max-w-5xl px-4 sm:px-6`.
- `AuthLayout`: single centered card `max-w-md` on `min-h-dvh`, brand mark above, links below (login <-> register).
- `CallLayout`: full-viewport, no site navigation to avoid accidental leaves; controls pinned to bottom.
Pages render inside layouts; pages do not each re-implement headers/containers.

## Page templates
| Page | Mobile | Desktop |
|---|---|---|
| Login / Register | one card, stacked fields, full-width primary button | same card centered, optional side panel explaining the product |
| Dashboard | stacked cards: "Start a call", "Join with code", language settings, voice profile status | 2-column: primary call actions left, settings/status right |
| VoiceProfile | stepper as single column with sticky action bar | stepper left, preview/record panel right |
| CallRoom | participants stacked, status strip on top, control dock bottom | participants side-by-side, side panel for captions/info (collapsible) |

## Call room specifics
- Control dock fixed to the bottom with `pb-[env(safe-area-inset-bottom)]`; primary controls (mute, end) are largest and thumb-reachable; End is visually separated from Mute to prevent mis-taps.
- Use `min-h-dvh`/`h-dvh`, not `vh`, so mobile address bars don't cut off controls. Set `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">`.
- Landscape phone: collapse captions panel, shrink participant tiles; never hide mute/end.
- Screen wake: consider the Screen Wake Lock API during calls so the screen doesn't sleep; feature-detect it.
- Mobile browsers pause audio in background tabs and require a gesture to start playback: show a clear "Tap to enable audio" state (details in `call-room-ui`).

## Layout rules
1. Mobile-first utilities; avoid fixed pixel widths - prefer `max-w-*`, `w-full`, `flex`/`grid` with `gap-*`.
2. Use CSS grid for 2D page layout, flex for rows/stacks. Avoid absolute positioning except overlays and the control dock.
3. Prevent horizontal scroll at 320px. Long Malayalam/Tamil words and room codes must wrap or truncate with `break-words`/`truncate` + title.
4. Text-expansion safe: UI text in Tamil/Malayalam is often 20-40% longer than English; no fixed-width buttons.
5. Keep reading order = visual order (don't reorder with CSS in ways that break keyboard/screen-reader flow).
6. Sticky headers/docks must not cover focused elements (`scroll-padding`).
7. Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Verify
Screenshot each page at 360 / 768 / 1280 in the browser (or via dev tools device mode), check no overflow, no overlapped controls, readable text, reachable primary action with one thumb. Rotate to landscape for CallRoom.
