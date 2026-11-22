---
name: ui-motion-feedback
description: Motion, micro-interactions and live feedback for the VoiceApp UI - speaking/audio-level indicators, translation-in-progress animation, connection transitions, button/press feedback, skeleton shimmer, with performance and reduced-motion rules. Use when adding animation, transitions, audio visualizers, or any real-time visual feedback.
---

# Motion & Feedback

Motion exists to **communicate state** (who is speaking, something is processing, connection changed), never to decorate. In a live call, distracting motion competes with listening.

## Principles
1. Purposeful: every animation answers "what changed?" or "what is happening?".
2. Fast and subtle: 100-200 ms for micro-interactions, 200-300 ms for panels/dialogs; ease-out entering, ease-in leaving.
3. Interruptible and non-blocking; never delay an action to finish an animation.
4. Always have a non-animated equivalent (text/icon state) - see `ui-accessibility`.
5. Respect `prefers-reduced-motion`: use `motion-safe:` for animations or `motion-reduce:` to disable; keep static state indicators.

## Tailwind v4 tools
- Transitions: `transition-colors duration-150`, `transition-transform`, `ease-out`. Avoid `transition-all` on large elements.
- Built-ins: `animate-pulse` (loading/skeleton), `animate-spin` (spinner). Custom keyframes go in `@theme` (`--animate-speaking: speaking 1.2s ease-in-out infinite;` with `@keyframes speaking {...}` in CSS), then use `animate-speaking`.
- Press feedback: `active:scale-95` on buttons; `hover:` effects only for pointer devices (`@media (hover: hover)` / `hover:` is already gated in v4).

## Call-specific feedback patterns
| State | Feedback |
|---|---|
| Local mic active | Level meter / ring around avatar driven by input level; muted -> static `MicOff` icon, dimmed ring (no animation) |
| Remote speaking | Soft pulsing ring on participant tile; paired with "speaking" aria/status text |
| Translation processing | Three-dot / waveform "translating..." in a status chip (animated), static text variant for reduced motion |
| Translated audio playing | Distinct tile outline in `audio-translated` color + "Translated (AI)" badge |
| Connecting / reconnecting | Spinner icon + text; color change of status pill; never a full-screen blocker |
| Delayed processing | After a threshold (e.g. >3 s), change text to "taking longer than usual" |
| Copy invite link | Button label swaps to "Copied" for 2 s, announced with `role="status"` |

## Audio level visualization (implementation)
- Use Web Audio `AnalyserNode` on the local/remote `MediaStream`; sample ~15-30 Hz, compute RMS, smooth (exponential), and drive **CSS variables or transform scale**, not React state per frame.
- Use `requestAnimationFrame` in a hook, cancel on unmount, disconnect the analyser and **don't create extra AudioContexts** (reuse one; resume it after a user gesture).
- Never route the analyser to `destination` (it would duplicate/echo audio).
- Throttle React state to meaningful changes (speaking true/false with hysteresis ~200-300 ms to avoid flicker).

## Performance
Animate only `transform` and `opacity`; avoid animating layout properties (`width`, `top`) and large blurs/shadows; keep animations off the main React render path; test on a mid-range phone with a call active (CPU is shared with WebRTC and audio processing, so heavy UI animation degrades call quality).

## Loading patterns
Skeleton for layout-shaped content (dashboard cards), spinner for short button waits (<~2 s), progress text for multi-step waits (voice profile creation: "Processing your voice... this can take a minute"). Avoid layout shift: reserve space.

## Done when
Animations disappear (replaced by static equivalents) under `prefers-reduced-motion`; no frame drops during a simulated call; no animation conveys information that isn't also available as text.
