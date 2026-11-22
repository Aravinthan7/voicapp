---
name: translation-pipeline
description: Designing and implementing the real-time Malayalam-Tamil speech translation pipeline (streaming STT -> translation -> TTS/voice-conditioned speech) with per-direction isolation, partial results, sentence segmentation, turn-taking, playback ducking, latency instrumentation and failure handling. Use when touching backend speech/ code or any audio-translation flow.
---

# Real-time Translation Pipeline

Each direction is an **independent pipeline** that can run concurrently:

`ML mic -> streaming STT (ml) -> text -> translate ml->ta -> TTS/voice-conditioned (ta) -> Person B playback`
`TA mic -> streaming STT (ta) -> text -> translate ta->ml -> TTS/voice-conditioned (ml) -> Person A playback`

Order of work (milestones 4-6): test STT, translation and TTS **independently** with fakes/recorded samples -> one-way ML->TA -> reverse -> integrate.

## Structure (backend/app/speech/)
- `stt/`, `translation/`, `tts/` each define a `Protocol` interface plus provider implementations selected by config; add a `fake` implementation for tests.
- `pipeline.py` orchestrates one direction: `PipelineSession(source_lang, target_lang, voice_profile | None)`.
- Use `asyncio` queues between stages so stages run concurrently (STT keeps consuming while TTS is speaking). Bounded queues + backpressure; drop/flag rather than grow unbounded.
- One session per (room, speaker). Create on call start, tear down on end/disconnect; no state shared between directions.

## Streaming behavior
- Input: small audio frames (e.g. 20-100 ms) from the speaker, resampled to what the provider wants.
- STT emits **partial** and **final** hypotheses. Only translate/speak **finalized** segments or stable prefixes at clause/sentence boundaries; partials may be sent to the UI as captions only. Expect corrections - tag segments with ids and `is_final`.
- Use VAD / provider endpointing for pauses. Tune a max-segment length so long monologues do not wait for a full stop.
- Translation gets short context (previous segment) for coherence but keeps latency low; do not block on whole-paragraph context.
- TTS: stream chunks to the receiver as soon as available; sequence-number every chunk to avoid gaps and **repeated playback**; preserve order per speaker.
- Do not silently drop recognized speech. If a stage fails, emit a `translation-status: unavailable` event and either retry (only if idempotent and within a time budget) or surface it.

## Playback rules
- By default the receiver hears **translated audio only**. While translated audio plays, mute/duck the speaker's original track for that receiver; restore afterwards. Original-audio mode and "standard voice" mode are user toggles (see `call-room-ui`).
- Never feed generated audio back into the same speaker's STT (loopback) - tag and exclude it.
- Turn-taking MVP policy (decide + document): queue translated utterances in order; on new speech from the same speaker after a long pause, flush stale queue; if both speak, process both independently but warn the UI about overlap.

## Voice
If a consented voice profile is ready, pass its id to TTS; otherwise (or on failure / unsupported language) fall back to a labeled standard voice. Never use another person's voice. See `voice-profile-consent`.

## Instrument every stage
Timestamps per segment: `t_speech_end`, `t_stt_final`, `t_translation_done`, `t_tts_first_byte`, `t_playback_start`. Emit structured logs/metrics with segment id, provider, language pair, durations, and error codes - **no transcript text or audio in logs**. The headline metric is end-of-phrase -> start-of-translated-playback; a 1-2 s target for short utterances is exploratory, not a promise.

## Failure and limits
Timeouts per stage; circuit breaker per provider; map provider errors to stable codes (`STT_FAILED`, `TRANSLATION_FAILED`, `TTS_FAILED`, `RATE_LIMITED`, `UNSUPPORTED_LANGUAGE`, `VOICE_PROFILE_UNAVAILABLE`); enforce per-user/per-call usage limits to bound cost; track cost per call minute via usage events.

## Don'ts
- Don't assume a model handles Malayalam/Tamil - confirm via `provider-evaluation`.
- Don't couple a provider SDK into routes or the WebRTC layer.
- Don't persist audio or text unless an explicit, documented decision says so.
