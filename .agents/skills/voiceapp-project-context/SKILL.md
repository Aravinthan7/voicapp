---
name: voiceapp-project-context
description: Core product context, scope boundaries and guardrails for the Multilingual Voice Communication Platform (live audio translation between any supported languages; Malayalam-Tamil is the first validated pair). Use at the start of any VoiceApp task, when deciding whether something is in scope for Phase 1, when planning milestones, or when a request touches an open decision.
---

# VoiceApp Project Context

Source of truth: `Project_scope.md` at the repo root. Re-read the relevant section if this summary is not enough, and update section 16 (Implementation Status) when work completes.

## What we are building
A web app where two people who speak different languages hold a live audio call. Each user picks the language they **speak** and the language they want to **hear** (any supported language, chosen independently); the other person's speech is translated into that listening language automatically. **The receiver always decides what they hear.** Phase 1 is strictly **one-to-one** (exactly two registered participants); guest access and group calls are deferred. The product is delivered as **SaaS**: accounts own a workspace. **Malayalam <-> Tamil is the first validated pair, not the only one.** Translated speech should resemble the original speaker's voice only when that speaker has explicitly consented.

## Phase 1 (current): audio-only web app
In scope: registration/login (both participants are registered users), SaaS foundations (workspaces, usage metering, plan limits), profile + language preferences, consent-based voice enrollment, one-to-one call rooms (invite link or room code; exactly 2 participants, a third is rejected), mute/end call, bidirectional STT -> translate -> TTS pipeline, output preferences, basic call UI, error handling, latency and quality measurement.

**Out of scope - do not build, and push back if asked:** video, lip-sync, group/many-to-many calls (>2; Phase 1 is strictly one-to-one), guest access via link (deferred, scope 5.4), native mobile, social feed/messaging/contacts, default call recording, full transcript history, training custom foundation models, guaranteed voice/accent/emotion preservation.

Phase 2 (video + lip-sync) starts only after the audio experience is validated. Do not let it delay Phase 1.

## Stack (fixed unless the scope doc changes)
React + Vite + TypeScript, Tailwind v4, React Router, Axios, Lucide React | FastAPI (modular monolith, not microservices) | WebRTC for media, WebSockets for signaling/events | PostgreSQL + Redis. STT/translation/TTS providers and hosting are **undecided** - pending proof of concept.

## Non-negotiable principles
1. Validate the audio experience first; measure before optimizing.
2. Consent before any voice sample is collected or any voice profile created. Only the consenting user's own voice.
3. No call audio recorded or retained by default.
4. Disclose third-party AI processing and label translated/AI-generated audio in the UI.
5. Never assume a provider supports a given language (Malayalam/Tamil included) for STT, translation, TTS or cross-lingual cloning because it is "multilingual". Verify per language and direction; enable a language only after validation.
6. Standard generated-voice fallback must always exist.
7. Provider API keys never reach the frontend.
8. Original and translated audio must not play together by default.
9. Language handling is data-driven (a language registry with capability flags). Never hard-code Malayalam/Tamil in logic, schemas, defaults or UI. If the speaker's language equals the receiver's listening language, skip translation and deliver the original audio.
10. The receiver chooses the language they hear; the other participant never overrides it.
11. Usage is metered per workspace; metering and limits must never break a live call. Guest access is deferred. See `saas-workspaces-guest-access`.
12. Phase 1 is strictly one-to-one: exactly two registered participants; reject a third.

## Open decisions - do not silently decide
Invite links vs room codes (registered users only in Phase 1); voice enrollment optional vs required; provider choice; captions in MVP; in-memory vs buffered audio; hosting/region/concurrency; latency/quality thresholds; private prototype vs public beta; managed vs self-hosted WebRTC; which audio output modes ship first; which languages beyond Malayalam/Tamil launch; pivot translation through a common language (e.g. English); changing languages mid-call; auto-detected vs user-selected speaking language; how unsupported/experimental languages are shown; SaaS pricing/plans; payment provider and billing timing; teams in Phase 1; API/widget; data residency; (deferred with guest access: guest-link policy, guest voice enrollment, who is billed for guest usage).

When a task depends on one of these: pick the least-committal implementation (e.g. put the choice behind a config flag or interface), state the assumption explicitly, and ask the user if the choice would be expensive to reverse.

## Milestone order
1 provider validation -> 2 app foundation (auth, rooms) -> 3 plain two-user WebRTC audio -> 4 STT/MT/TTS tested independently -> 5 ML->TA one way (first pair) -> 6 TA->ML -> 7 voice-profile experiment -> 8 integrated MVP -> 9 SaaS foundations -> 10 controlled testing -> 11 language expansion (per-language validation) -> 12 guest access via link (deferred) -> 13 SaaS commercialization (to be confirmed) -> 14 Phase 2 discovery.
Work in this order; do not wire translation into calls before plain audio calling works.

## Related skills
`frontend-app-architecture`, `call-room-ui`, `fastapi-backend`, `database-redis-state`, `auth-security-privacy`, `webrtc-signaling-audio`, `translation-pipeline`, `voice-profile-consent`, `provider-evaluation`, `quality-metrics-testing`, `saas-workspaces-guest-access`, `react-frontend`.
