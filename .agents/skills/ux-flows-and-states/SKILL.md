---
name: ux-flows-and-states
description: User-experience design for VoiceApp journeys - onboarding, sign-up/login, language setup, voice enrollment, starting and joining a call, in-call recovery, and ending a call - including loading/empty/error states, microcopy, and trust and consent UX. Use when designing or reviewing a user flow, writing UI copy, or deciding what a screen should say or do.
---

# UX Flows, States & Microcopy

Users are two people (e.g. a Malayalam and a Tamil speaker) who may not be tech-savvy and may not share a language - **one of them is often being invited by the other**. Optimize for: get into a call fast, always know what's happening, never be surprised by AI or recording.

## Design principles
1. **Time to first call**: minimal steps; defer optional things (voice profile) until after the first successful call where possible (voice enrollment optional vs required is an *open decision* - design so both work).
2. **Always show system status**: connecting, translating, delayed, failed. Silence is the worst state in an audio product.
3. **Honesty about AI**: label translated/AI audio; disclose third-party processing; never imply the person said words verbatim.
4. **Reversible and controllable**: easy switch to original audio, easy mute, easy leave, easy delete voice data.
5. **Plain language**: no jargon (STT, TTS, ICE, SFU) in user text.
6. **Recoverable errors**: every error says what happened, what it means for them, and what to do next.

## Core flows (sketch each as steps + states before coding)
**1. First visit -> account**: landing/Login -> Register (name, email, password, speaking language, language to hear) -> Dashboard. Guest joining is undecided; if added, an invitee lands on a Join screen with name + language + mic check only.

**2. Mic setup** (shared by call and voice profile): explain why mic is needed -> browser prompt -> level meter "say something" confirmation -> proceed. Denied -> instructions per browser + "Try again".

**3. Start a call**: choose/confirm language pair (blocked with explanation if unsupported) -> create room -> waiting screen with code + copy-invite button + "Waiting for [name]..." + cancel.

**4. Join a call**: enter code or open link -> shows who invited you and the language pair -> mic check -> "Join call" (this click also unlocks audio playback).

**5. In call**: see `call-room-ui`. Pre-call tip: "Use headphones to avoid echo."

**6. Reconnect / failure**: banner "Connection lost - reconnecting..." with timer; after a timeout, offer Retry / Leave. Other person's view shows "[Name] lost connection".

**7. End call**: confirm only if it would be easy to hit by mistake (long-press/separate button preferred over confirm dialogs); afterwards a short summary screen and an optional 1-tap feedback ("Did you understand the translation? Yes / Somewhat / No") feeding the success metrics.

**8. Voice profile**: Explain -> Consent (explicit, unchecked) -> Record -> Test playback -> Done; always-visible "Delete my voice" in settings. See `voice-profile-consent`.

## State matrix - design all for every data screen
`loading` (skeleton) | `empty` (explain + action) | `error` (cause + retry) | `partial` | `offline` | `success`. Don't ship a screen with only the happy path.

## Microcopy
- Buttons are verbs: "Start call", "Join call", "Copy invite link", "Delete voice profile" (not "Submit", "OK").
- Errors: what + why + fix. e.g. "We can't hear you. Microphone access is blocked. Allow it in your browser's site settings, then tap Try again."
- Don't blame the user; don't say "Oops!" for serious failures.
- Translation delay: "Translating... taking longer than usual" - not a spinner alone.
- AI labels: "Translated audio (AI-generated)", "Original audio", "Using standard voice".
- Consent text: short, specific, plain; links to full policy; names the provider category and retention.
- Write copy keys centrally (a `strings.ts` object) to make later translation of the UI possible (see `ux-multilingual-content`).

## Trust & safety UX
Show who is in the room before audio starts; room codes are short-lived; display a persistent but unobtrusive "AI translation active" indicator; make consent and deletion reachable in <=2 taps from Dashboard.

## Measure
Add lightweight events for funnel steps (landing -> registered -> mic granted -> call created -> second person joined -> first translated utterance heard). No audio/text content in analytics.

## Done when
Each flow has: steps, entry/exit points, all states, final copy, and keyboard + mobile behavior checked.
