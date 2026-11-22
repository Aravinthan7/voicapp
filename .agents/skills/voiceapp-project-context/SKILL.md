---
name: voiceapp-project-context
description: Core product context, scope boundaries and guardrails for the Multilingual Voice Communication Platform (Malayalam-Tamil live audio translation). Use at the start of any VoiceApp task, when deciding whether something is in scope for Phase 1, when planning milestones, or when a request touches an open decision.
---

# VoiceApp Project Context

Source of truth: `Project_scope.md` at the repo root. Re-read the relevant section if this summary is not enough, and update section 16 (Implementation Status) when work completes.

## What we are building
A web app where two people who speak different languages hold a live audio call. Each hears the other's speech translated into their own language, automatically. First pair: **Malayalam <-> Tamil**. Translated speech should resemble the original speaker's voice only when that speaker has explicitly consented.

## Phase 1 (current): audio-only web app
In scope: registration/login, profile + language preferences, consent-based voice enrollment, call rooms (invite link / room code, 2 participants), mute/end call, bidirectional STT -> translate -> TTS pipeline, output preferences, basic call UI, error handling, latency and quality measurement.

**Out of scope - do not build, and push back if asked:** video, lip-sync, group calls (>2), native mobile, social feed/messaging/contacts, default call recording, full transcript history, training custom foundation models, guaranteed voice/accent/emotion preservation.

Phase 2 (video + lip-sync) starts only after the audio experience is validated. Do not let it delay Phase 1.

## Stack (fixed unless the scope doc changes)
React + Vite + TypeScript, Tailwind v4, React Router, Axios, Lucide React | FastAPI (modular monolith, not microservices) | WebRTC for media, WebSockets for signaling/events | PostgreSQL + Redis. STT/translation/TTS providers and hosting are **undecided** - pending proof of concept.

## Non-negotiable principles
1. Validate the audio experience first; measure before optimizing.
2. Consent before any voice sample is collected or any voice profile created. Only the consenting user's own voice.
3. No call audio recorded or retained by default.
4. Disclose third-party AI processing and label translated/AI-generated audio in the UI.
5. Never assume a provider supports Malayalam/Tamil STT or cross-lingual cloning because it is "multilingual". Verify.
6. Standard generated-voice fallback must always exist.
7. Provider API keys never reach the frontend.
8. Original and translated audio must not play together by default.

## Open decisions - do not silently decide
Account required vs guest joining; invite link vs room code vs both; voice enrollment optional vs required; provider choice; captions in MVP; in-memory vs buffered audio; hosting/region/concurrency; latency/quality thresholds; private prototype vs public beta; managed vs self-hosted WebRTC; which audio output modes ship first.

When a task depends on one of these: pick the least-committal implementation (e.g. put the choice behind a config flag or interface), state the assumption explicitly, and ask the user if the choice would be expensive to reverse.

## Milestone order
1 provider validation -> 2 app foundation (auth, rooms) -> 3 plain two-user WebRTC audio -> 4 STT/MT/TTS tested independently -> 5 ML->TA one way -> 6 TA->ML -> 7 voice-profile experiment -> 8 integrated MVP -> 9 controlled testing -> 10 Phase 2 discovery.
Work in this order; do not wire translation into calls before plain audio calling works.

## Related skills
`frontend-app-architecture`, `call-room-ui`, `fastapi-backend`, `database-redis-state`, `auth-security-privacy`, `webrtc-signaling-audio`, `translation-pipeline`, `voice-profile-consent`, `provider-evaluation`, `quality-metrics-testing`, `react-frontend`.
