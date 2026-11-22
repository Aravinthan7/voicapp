---
name: voice-profile-consent
description: Consent-first voice enrollment and voice-profile lifecycle for VoiceApp - consent capture, sample recording/upload, provider voice creation, test playback, re-record, deletion, and the standard-voice fallback. Use when building VoiceProfile.tsx, voice-profile APIs, or anything that records, stores, or clones a voice.
---

# Voice Profile & Consent

Voice cloning is optional in effect and ethically sensitive. The rule: **no consent, no sample, no profile.** Only the speaker's own voice, ever.

## Flow (scope 5.1 C)
1. **Explain** what will happen: what is recorded, which third-party provider processes it, how long it is kept, what the profile is used for, and how to delete it.
2. **Explicit consent**: unchecked checkbox + button (not pre-ticked, not bundled with ToS). Record `consent_text_version`, timestamp, user id server-side *before* accepting any audio.
3. **Capture** a sample in-browser (`MediaRecorder`) or upload; show level meter, duration guidance, and a script to read. Validate format/length/size client- and server-side.
4. **Create** the profile via the provider adapter (`VoiceProfileProvider`), asynchronously if needed; status `pending -> ready | failed`.
5. **Test step** where supported: generate a short phrase in the user's listening/target language, play it back, let the user accept or re-record.
6. **Manage**: re-record (replaces; old provider voice deleted), disable imitation (use standard voice), delete everything.

## Hard requirements
- Verify the user is the owner/speaker (authenticated account, live in-browser recording preferred over arbitrary uploaded files) to reduce cloning of other people's voices. Terms must forbid cloning anyone else.
- Backend checks consent exists and is not revoked on **every** TTS request that uses the profile.
- **Deletion** removes: stored sample (if any was retained), provider-side voice/profile, DB metadata (consent record kept only as minimal audit data, per policy), and any caches. Return success only after provider deletion is confirmed; surface failure and retry otherwise.
- Prefer not retaining raw samples after the provider voice is created, unless required (open decision); if retained: encrypted, access-restricted, not publicly addressable.
- Never expose provider voice ids or sample URLs to other users. Other participants never download your sample.
- Disclose to the *listener* when imitated voice is being played (see `call-room-ui`).

## Language caveat
Do not assume cross-lingual cloning works for Malayalam or Tamil because the provider is "multilingual". Check `provider-evaluation` results and expose per-language capability in the API (`GET /languages` includes `voice_cloning_supported`). If unsupported or quality is poor for the target language, use the **standard generated-voice fallback**, clearly labeled, and make that the behavior - not an error - for the call.

## Frontend (VoiceProfile.tsx)
Steps UI: Consent -> Record -> Review/Test -> Done; each with loading/error states; mic-permission handling shared with `call-room-ui`; Delete button with confirmation; status badge (`Not set up | Processing | Ready | Failed | Disabled`). Guarantee that cancelling at any step leaves no sample stored.

## Verify
- Without consent the API rejects sample upload (403/422).
- Delete -> provider voice gone, TTS falls back to standard voice, UI shows "Not set up".
- Re-record replaces the old voice; no orphaned provider voices.
- Tests cover consent-revoked mid-call (stop using the cloned voice at the next utterance).
