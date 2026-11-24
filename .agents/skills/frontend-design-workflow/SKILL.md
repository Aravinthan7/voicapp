---
name: frontend-design-workflow
description: End-to-end process and review checklist for designing and building a VoiceApp screen or feature - from understanding the flow to wireframing, building with tokens/components, verifying in the browser, and doing a design/UX/a11y review. Use at the start of any UI task (new page, redesign, polish pass) and as a final review gate.
---

# Frontend Design Workflow

This is the orchestrating skill for UI work. It tells you the order of operations and which specialized skill to consult at each step.

## Skill map
| Need | Skill |
|---|---|
| Product constraints, scope, open decisions | `voiceapp-project-context` |
| Journey, states, copy, consent UX | `ux-flows-and-states` |
| Colors, type, spacing, Tailwind v4 tokens | `ui-design-system` |
| Page structure, responsive, mobile quirks | `ui-layout-responsive` |
| Buttons, forms, dialogs, state components | `ui-component-patterns` |
| Animation, audio-level, status feedback | `ui-motion-feedback` |
| WCAG, keyboard, screen readers | `ui-accessibility` |
| Malayalam/Tamil text, language pickers, captions | `ux-multilingual-content` |
| Call-specific UI | `call-room-ui` |
| Repo wiring (routes, services, context) | `frontend-app-architecture`, `react-frontend` |

## Process
1. **Understand** - Read the relevant section of `Project_scope.md`. Confirm the feature is Phase 1 (not video/lip-sync/group/mobile-native). Note open decisions that affect the screen (voice optional, captions) and design so they can flip.
2. **Inspect the repo** - existing `src/` structure, `index.css` tokens, existing components. Reuse and extend; do not restyle unrelated code.
3. **Define the flow** - user goal, entry point, steps, exit, and every state (loading/empty/error/offline/success). Write the copy now (`ux-flows-and-states`).
4. **Wireframe in words/ASCII** for mobile (360px) and desktop; call out the primary action, status area, and error placement. Share it with the user for non-trivial screens *before* building (propose approach, then implement - per `react-frontend` rules).
5. **Tokens before components** - add any missing semantic tokens to `@theme`; then compose from `components/common` primitives; add new primitives only when two or more places need them.
6. **Build mobile-first**, then enhance for wider screens; state components first, happy path last.
7. **Wire behavior** through hooks/services (no API calls in components); type everything.
8. **Verify in a real browser**: run `npm run dev`, load the page, exercise every state (force errors by stopping the backend, denying the mic, throttling the network), screenshot at 360 / 768 / 1280. If you can't view it, say so explicitly rather than claiming it works.
9. **Review gate** (below), then `npm run build && npm run lint`.
10. **Update** `Project_scope.md` section 16 checklist if an item was completed.

## Design review checklist
**Clarity**
- [ ] One obvious primary action per screen; hierarchy readable at a glance
- [ ] User always knows: where am I, what is happening, what can I do next
- [ ] Copy is plain, action-oriented, error messages say what/why/fix

**Trust & AI honesty**
- [ ] Translated/AI audio and imitated voice are labeled
- [ ] Consent and third-party processing are disclosed where relevant
- [ ] Deletion/opt-out reachable and explicit

**Visual**
- [ ] Only tokens/Tailwind scale; consistent spacing, radius, type
- [ ] Contrast verified; state never color-only
- [ ] Looks right in dark theme (and light if shipped)

**Responsive**
- [ ] No overflow at 320px; thumb-reachable primary controls; `dvh` and safe-area used
- [ ] Long Malayalam/Tamil strings don't clip or break layout

**Accessibility**
- [ ] Keyboard-only flow works; focus visible and managed
- [ ] Labels, names, roles, live regions; `lang` attributes
- [ ] Reduced motion honored

**Robustness**
- [ ] Loading, empty, error, offline states exist and were exercised
- [ ] Cleanup of mic tracks, sockets, rAF loops on unmount
- [ ] No secrets or provider keys in the client

## Anti-patterns to reject
Generic "AI landing page" gradients and glassmorphism with no purpose; decorative animation during calls; tiny low-contrast gray text on dark backgrounds; modals for things that should be inline; spinner-only waits with no text; destructive buttons next to primary controls with no separation; hiding consent in a ToS link; English-only assumptions in layout.

## Reporting
When finishing, tell the user what was built, which states were verified and how, what was *not* verified (e.g. real-device screen reader, iOS Safari), and any open decisions you assumed.
