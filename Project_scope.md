# Multilingual Voice Communication Platform

**Document type:** Project scope and implementation guide  
**Version:** 1.5  
**Status:** Working project document  
**Product model:** Software-as-a-Service (SaaS)  
**Current focus:** Phase 1 — audio-only web application

---

## 1. Project Overview

Build a web application that allows two people who speak different languages to communicate through a live audio call.

The platform is **language-agnostic by design**. It is not limited to Malayalam and Tamil. Each user chooses:

- the language they **speak**, and
- the language they want to **hear**.

The system translates the other participant's speech into the language each user chose to hear. For example:

- Person A speaks Malayalam and hears Malayalam.
- Person B speaks Tamil and hears Tamil.
- Person C speaks Hindi and chooses to hear English.

Additional principles:

- Translated speech should ideally resemble the original speaker's voice, subject to the capabilities of the selected speech-generation technology and the speaker's explicit consent.
- Translation and playback should happen automatically during the call without requiring a manual translate action for every sentence.

**Language support principle:** Malayalam and Tamil is the **first language pair to be validated** end to end. Any other language can be offered to users as soon as speech recognition, translation, and speech generation for that language are verified. A language or language direction is enabled only after that verification; availability depends on the capabilities of the selected providers for each language.

**The receiver decides the listening language.** The language a person hears is always chosen by that person (the receiver), never by the speaker, the host, or the person who sent the invitation. This applies to both participants in a call.

**Product model:** The platform is delivered as a **SaaS product**. A customer signs up for an account (workspace), creates calls, and invites one other registered user to a one-to-one call. Guest access (joining without an account) is a later addition. Usage is metered, and plans, limits, and billing are applied per account/workspace.

**Phase 1 is one-to-one only.** A call has exactly two participants, both registered users. Group, conference, and many-to-many calls, and guest access, are not part of Phase 1.

**Phase 1 is audio calling only.** Video calling and translated lip-sync are future work and must not delay validation of the audio experience.

## 2. Product Vision

Make conversations between people who speak different languages feel as natural and effortless as a regular voice call.

Users can pick any speaking language and any listening language that the platform supports. Longer-term possibilities include growing the supported-language catalogue (Indian and international languages), video calls, and synchronized translated lip movements.

As a SaaS product, anyone with an account can invite another person to a one-to-one multilingual conversation, and each person hears the conversation in the language they choose. Joining without an account (guest access) is a later addition.

## 3. Goals

### Phase 1 goals

1. Build a responsive web application.
2. Allow two users to join the same audio call.
3. Capture each participant's microphone audio.
4. Recognize speech in the speaker's language.
5. Translate recognized speech into the language the other participant chose to hear.
6. Generate translated speech audio.
7. Deliver translated audio to the receiver automatically.
8. Evaluate whether generated speech can resemble the original speaker's authorized voice.
9. Provide basic call controls and clear connection/error states.
10. Measure translation quality and end-to-end delay.
11. Let each user choose any supported speaking language and listening language, with the supported-language list driven by configuration rather than hard-coded.
12. Keep every receiver in control of the language they hear.
13. Focus Phase 1 on one-to-one calls between exactly two registered users. Group and many-to-many calls are not part of this phase.
14. Deliver the product as SaaS: calls, usage, and limits belong to an account/workspace, and usage is metered.

### Long-term goals

- Add live video calling.
- Add translated lip-sync or visual mouth-movement adaptation.
- Expand the supported-language catalogue to any language with verified speech recognition, translation, and speech-generation support.
- Improve naturalness, emotion, accent handling, and speech timing.
- Consider mobile applications after validating the web experience.
- Consider an embeddable widget or public API so customers can offer multilingual calls inside their own products (SaaS expansion).
- Add guest access through a link (joining without an account), and only then consider group calls, after the one-to-one experience is validated.

## 4. Initial Users and Main Use Case

### Initial users

- Anyone who needs to talk with a person who speaks a different language.
- First validation focus: Malayalam speakers and Tamil speakers.

### User types

- **Registered user:** owns an account/workspace and can create or join calls. In Phase 1 both participants in a call are registered users. One of them creates the call (the caller) and invites the other.
- Guest access (joining without an account) is deferred. See section 5.4.

### Main use case

Two users join the same call. Each user has chosen a speaking language and a listening language.

First validated example: a Malayalam-speaking user and a Tamil-speaking user.

1. The speaker talks naturally in their chosen speaking language.
2. The system recognizes the speech in that language.
3. The system translates it into the language the other participant chose to hear.
4. The system generates speech in that language, optionally conditioned on the speaker's authorized voice profile.
5. The receiver hears the translated audio.
6. The same process runs in the opposite direction.

Examples of language selections the design must support (each subject to verified provider support):

| Person A speaks | Person A hears | Person B speaks | Person B hears |
|---|---|---|---|
| Malayalam | Malayalam | Tamil | Tamil |
| Hindi | Hindi | English | English |
| Tamil | English | Telugu | Telugu |

Speaking and listening languages are independent. A user may choose to hear a language different from the one they speak.

If the speaker's language is the same as the receiver's chosen listening language, no translation is needed and the original audio is delivered.

Both directions should operate independently and support normal conversational turn-taking. The translation direction for each receiver is determined by the speaker's speaking language and the receiver's listening language, not by a hard-coded language pair.

### Starting a call between two registered users

1. The caller creates a call and shares the invite link or room code.
2. The invited person signs in (or registers) and opens the link or enters the code.
3. Each person confirms the language they speak and the language they want to hear.
4. Each person completes a microphone check and acknowledges the AI-processing disclosure.
5. Both join. Each person hears the other in the language they chose.

The two participants' language choices are independent. Neither participant can change what the other hears.

A call has exactly two participants. Group, conference, and many-to-many calls are not supported in Phase 1.

## 5. Phase 1 Scope — Audio Web Application

### 5.1 Included features

#### A. User access

- User registration and login.
- User profile with display name.
- Language preference settings.
- Microphone permission guidance.
- Both participants in a Phase 1 call are registered users (no guest access in Phase 1).

#### B. Language settings

- Select the user's speaking language from the supported-language list.
- Select the language they want to hear from the supported-language list. It does not have to be the other participant's language.
- Speaking and listening languages are chosen independently for each user.
- The supported-language list is maintained as data/configuration, with per-language capability flags (speech recognition, translation, speech generation, voice cloning), not hard-coded in the interface.
- First validated language pair: Malayalam and Tamil. More languages are enabled as provider support is verified.
- Validate the language combination before starting a call. Each speaker's language needs speech recognition support, and the translation from that language into the other participant's listening language needs translation and speech-generation support.
- Explain clearly when a combination is unsupported or experimental.
- If the speaker's language matches the receiver's listening language, skip translation and deliver the original audio.
- The listening language is always chosen by the receiver. Each user sets it in their profile or per call.
- The interface may suggest a default (for example from the browser language), but the receiver confirms the choice.

#### C. Voice profile enrollment

- Allow a user to provide a voice sample only with explicit consent.
- Create or configure a voice profile using a compatible voice-generation service.
- Provide sample playback or a test step where supported.
- Allow users to re-record or delete their voice sample/profile.
- Use only the voice of the consenting user.
- If reliable voice cloning is unavailable for the target language or language combination, provide a clearly labeled standard generated-voice fallback.

Voice enrollment does not necessarily require training a new AI model for every user. The implementation may use a provider's voice-cloning or speaker-conditioning feature.

#### D. Audio call management

- Create a call room.
- Join a call using an invite link or room code. The invited person signs in as a registered user.
- Support exactly two participants (one-to-one) in the initial release, and reject a third participant.
- Start and end a call.
- Mute and unmute the microphone.
- Display participant and connection status.
- Handle microphone permission denial and network interruption.

#### E. Real-time speech translation pipeline

For each participant, independently:

1. Capture microphone audio.
2. Stream audio to the speech-processing pipeline.
3. Perform speech recognition (STT) in the speaker's selected speaking language.
4. Translate recognized speech into the receiver's selected listening language (skipped if it matches the speaker's language).
5. Generate translated speech audio (TTS or voice-conditioned speech generation).
6. Stream or play generated audio to the receiver.
7. Avoid playing original speaker audio and translated audio simultaneously by default.

Support incremental or streaming processing where selected services allow it. Handle partial speech results, corrections, pauses, and sentence boundaries.

#### F. Audio output preferences

- Default: play translated audio.
- Provide an option to switch to original audio.
- Provide a way to disable voice imitation and use a standard generated voice.
- Clearly indicate when translated or AI-generated audio is being played.

#### G. Basic call interface

- Call room information.
- Participant names.
- Microphone mute/unmute.
- End-call control.
- Each participant's speaking and listening language.
- Connection status.
- Processing or translation status.
- Optional translated text captions for debugging and accessibility, if feasible for the MVP.

#### H. Error handling

- Microphone unavailable or permission denied.
- Speech recognition failure.
- Translation or speech-generation service failure.
- Network interruption.
- Call participant disconnects.
- Unsupported language or voice profile.
- Rate limit or service quota exceeded.
- Invite link or room code invalid or expired, or the call is full or has ended.
- Workspace plan limit reached.

#### I. One-to-one calls only (Phase 1 focus)

- A call has exactly two participants, both registered users.
- The first release focuses only on this two-person conversation: each person speaks, and the other person hears the translation in the language they chose.
- A third person cannot join. They see a clear "call is full" message.
- Group, conference, and many-to-many calls are out of scope.
- Guest access (joining without an account) is deferred. See section 5.4.
- Keep the speech pipeline modeled per speaker-to-receiver direction, but do not build or optimize group behavior in Phase 1.

### 5.2 Out of scope for Phase 1

- Video calling.
- Lip-sync or facial animation.
- Group, conference, or many-to-many calls. Phase 1 is strictly one-to-one with exactly two participants.
- Guest access through a link (joining without an account). Deferred, see section 5.4.
- Native mobile applications.
- Public social feed, messaging, or contact discovery.
- Call recording by default.
- Full call transcription history.
- User-created custom AI models or training a foundation model.
- Guaranteed preservation of the speaker's exact accent, emotion, and vocal identity in every target language.

### 5.3 SaaS Product Requirements

The product is delivered as SaaS. Plans, pricing, and the payment provider are open decisions. The capabilities below are grouped by when they are proposed.

#### SaaS foundations (proposed for Phase 1)

- **Accounts and workspaces:** a registered user owns a workspace. Calls, voice profiles, usage, and settings belong to a workspace.
- **Tenant isolation:** data from one workspace is never accessible from another.
- **Usage metering:** record translated minutes per call, per direction, and per processing stage and provider where possible, with cost attribution.
- **Plan limits and quotas:** configurable per plan, for example monthly translated minutes, concurrent calls, and enabled languages. Reaching a limit produces a clear message for the call owner and for the other participant.
- **Abuse and cost protection:** rate limits and concurrency caps per workspace and per user.
- **Usage visibility:** a simple usage view for the workspace owner.

#### SaaS commercialization (proposed, to be confirmed)

- Subscription plans, free trial or free tier, and pay-as-you-go minutes.
- Billing through a payment provider: payment methods, invoices, upgrades, and downgrades.
- Team management: invite members, roles, and shared workspace settings.
- Admin dashboard: usage, call quality, error rates, and cost per workspace.
- Public API with API keys and an embeddable widget.
- Data-processing terms, data residency options, and uptime targets.
- Branding options for customers.

Paid billing is not required to validate the audio experience, but the data model and metering should be built so billing can be added without rework.

### 5.4 Deferred: Guest Access via Link (not part of Phase 1)

**Status: deferred.** Guest access is not built in Phase 1. It will be reconsidered after the one-to-one audio experience between registered users is validated. The notes below keep the requirements so they are not lost.

**Core requirement (when built): the guest receives audio in the language they choose.** Whatever language a guest wants to hear, from the supported-language list, is the language in which they receive the other participant's speech. The guest selects it on the join screen opened from the guest link. The caller's speaking language, the caller's listening language, and the settings of whoever created the link never change what the guest hears.

| Caller speaks | Caller hears | Guest speaks | Guest hears (chosen on the guest link) |
|---|---|---|---|
| Malayalam | Malayalam | Tamil | Tamil |
| English | English | Hindi | Hindi |
| Tamil | Tamil | Malayalam | English |

Guest flow (when built):

1. The caller creates a call and copies a guest link.
2. The guest opens the link in a browser, with no installation and no account.
3. The guest sees who invited them, enters a display name, and chooses the language they speak and the language they want to hear.
4. The guest acknowledges the AI-processing disclosure and completes a microphone check.
5. The guest joins. The call is still limited to two participants.

Requirements to carry forward:

- A guest link grants access to one call only, expires, and can be revoked or regenerated by the caller. The caller can remove the guest.
- The join screen explains when the chosen language is unsupported for the other participant's language and offers supported languages or the original audio.
- If the guest's listening language equals the caller's speaking language, deliver the original audio without translation.
- Guests use the standard generated voice unless a guest voice-consent flow is added.
- Guest sessions use short-lived tokens scoped to the single call. Guest data is kept only for the call.
- Guest usage counts toward the caller's workspace usage and limits.
- Abuse controls: unguessable link tokens, rate limiting, and optional caller approval before the guest enters.

Risks to address when built: link sharing and cost abuse; guest audio processed without an account (needs disclosure and acknowledgment before joining).

Open decisions that apply to this section: items 21, 22, and 25 in section 15.

## 6. Phase 2 — Video and Lip-Sync

Phase 2 begins only after the audio experience is validated.

Planned capabilities:

1. Add live video calling.
2. Keep video transport independent from the translated-audio processing pipeline.
3. Synchronize translated audio playback with the video timeline.
4. Evaluate real-time lip-sync approaches.
5. Explore visual mouth-movement adaptation so the visible speaker appears to speak the translated audio.
6. Manage latency, buffering, and synchronization during network changes.
7. Add user controls and clear disclosure when facial or lip movements are AI-modified.

Lip-sync is a separate, technically demanding capability and is not part of the Phase 1 delivery commitment.

## 7. Technology Stack

The exact speech, translation, voice-generation providers and deployment platform must be selected after a technical proof of concept.

| Layer | Proposed technology |
|---|---|
| Web frontend | React + Vite + TypeScript |
| Frontend styling | Tailwind CSS v4 |
| Frontend routing | React Router |
| HTTP client | Axios |
| Frontend icons | Lucide React |
| Backend API | Python + FastAPI |
| Real-time audio transport | WebRTC |
| Application events/signaling | WebSockets |
| Speech recognition | Streaming speech-to-text service/model |
| Translation | Translation API or suitable language model |
| Speech generation | Multilingual TTS / voice-conditioned speech generation |
| Primary database | PostgreSQL |
| Session and transient state | Redis |
| Usage metering | Usage events in PostgreSQL, aggregated per workspace |
| Billing and payments | To be selected (SaaS commercialization) |
| Deployment | To be selected after prototype and cost evaluation |

### Architecture approach

Use a modular FastAPI backend initially rather than splitting the application into microservices prematurely.

- React is responsible for the user interface and browser-side call experience.
- WebRTC is the proposed real-time media transport.
- WebSockets are used for signaling and application events.
- FastAPI provides authentication, user/profile settings, call coordination, and integration with speech services.
- Speech processing is organized as independent pipelines for each translation direction.
- Language support is data-driven: a language registry (language code, display names, per-provider capability flags) drives call validation, the language options shown in the interface, and pipeline selection.
- SaaS concerns (workspaces, usage metering, plan limits) are modules inside the same FastAPI backend, not separate services.
- Every call, voice profile, and usage record belongs to a workspace (tenant).
- Evaluate an existing WebRTC media server/SFU or managed option for the MVP instead of building media infrastructure from scratch.
- The final media-routing design (client-side, server-side, or a combination) must be validated in the technical prototype.

### Speech pipelines

Pipelines are parameterized by language and are not tied to one pair. For each speaker-to-receiver direction, the source language is the speaker's speaking language and the target language is the receiver's listening language:

`Speaker microphone audio → Streaming STT (source language) → Source text → Translation (source → target) → Speech generation (target language) → Receiver playback`

If the source and target languages are the same, translation and speech generation are skipped and the original audio is played.

A direction is enabled only when speech recognition for the source language and translation plus speech generation for the target language have been verified.

**Example: Malayalam → Tamil** (first validated pair)

`Malayalam microphone audio → Streaming STT → Malayalam text → Tamil translation → Tamil speech generation → Person B playback`

**Example: Tamil → Malayalam** (first validated pair)

`Tamil microphone audio → Streaming STT → Tamil text → Malayalam translation → Malayalam speech generation → Person A playback`

### Provider evaluation checklist

For every speech or voice provider/model, verify:

- Explicit speech recognition support for each language to be enabled (first: Malayalam and Tamil).
- Translation quality for each enabled language direction (first: Malayalam-to-Tamil and Tamil-to-Malayalam), including whether direct translation is available or a pivot language is required.
- Target-language speech generation quality for each language.
- Cross-lingual voice cloning support for each target language.
- Streaming or chunked audio support.
- End-to-end latency.
- Commercial usage rights and licensing.
- Data retention, privacy, and deletion policies.
- Pricing, rate limits, and concurrency limits.

Do not assume that a model supports a particular language (including Malayalam or Tamil) for recognition, translation, or voice cloning merely because it is described as multilingual. Verify each language and direction before enabling it in the supported-language list.

## 8. Frontend Project Structure

Use TypeScript for all React components. Use `.tsx` for components containing JSX and `.ts` for TypeScript modules without JSX.

```text
frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── layout/
│   │   └── call/
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── VoiceProfile.tsx
│   │   └── CallRoom.tsx
│   ├── services/
│   │   └── api.ts
│   ├── hooks/
│   ├── context/
│   ├── routes/
│   │   └── AppRoutes.tsx
│   ├── types/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
└── vite.config.ts
```

This is the intended structure; folders can be introduced as implementation reaches those features.

### Frontend conventions

- Use TypeScript (`.ts` and `.tsx`) consistently.
- Type component props, form events, state models, API responses, and reusable data structures.
- Keep API calls in the `services` layer rather than directly inside page components.
- Keep reusable UI elements in `components`.
- Keep page-level screens in `pages`.
- Keep authentication/session state in a dedicated context or an equivalent state-management solution when needed.
- Use Tailwind CSS v4 for styling.
- Do not introduce a UI library that requires a global provider unless there is a clear project need.
- Do not store secrets or third-party provider API keys in frontend code.

## 9. Backend Project Structure (Proposed)

```text
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   ├── services/
│   │   ├── speech_to_text/
│   │   ├── translation/
│   │   ├── text_to_speech/
│   │   └── voice_profiles/
│   ├── websocket/
│   ├── webrtc/
│   ├── db/
│   └── main.py
├── tests/
├── requirements.txt
└── .env.example
```

This is a proposed modular structure, not a claim that all modules or providers have already been implemented.

SaaS modules to add when those features are reached: workspaces (tenancy), usage metering, plan limits, and later billing.

## 10. Non-Functional Requirements

### Performance

- Keep perceived conversation delay as low as practical.
- Measure latency from the end of a spoken phrase to the start of translated playback.
- Establish an initial target through the prototype; a 1–2 second target for short utterances may be explored but is not guaranteed.
- Avoid large audio gaps and repeated playback.
- Treat simultaneous speech and interruptions as engineering challenges.

### Reliability

- Recover gracefully from temporary network interruptions.
- Show clear status when speech processing is delayed or unavailable.
- Avoid silently dropping recognized speech.
- Handle service timeouts and retry only where safe.

### Security and privacy

- Use encrypted transport for calls and service communication.
- Protect authentication tokens and user data.
- Obtain explicit consent before collecting or generating a voice profile.
- Store voice samples and voice profiles securely with restricted access.
- Provide a way to delete voice samples and associated profiles.
- Do not clone another person's voice without their authorization.
- Do not record or retain call audio by default.
- Disclose when audio is processed by third-party AI services and explain relevant retention policies.
- Show this disclosure to both participants before they join a call, because both participants' audio is processed.

### Multi-tenancy and SaaS operations

- Isolate tenant data. Every query and authorization check is scoped to the workspace.
- Meter usage from call lifecycle events. Metering must be idempotent and must never block or degrade a live call.
- Enforce plan limits on the server. Define what happens at the limit (warn first, avoid cutting a call mid-sentence).
- Protect cost with rate limits, concurrency caps, and provider kill switches.
- Define availability targets and incident communication before public launch.
- Define data-processing terms, retention, and regional handling expected by customers.

### Accessibility and usability

- Make microphone and call controls easy to understand.
- Clearly distinguish original audio from translated audio.
- Provide understandable permission and error messages.
- Design for desktop and mobile browsers, subject to browser audio limitations.

## 11. Key Risks and Constraints

| Risk | Impact | Mitigation / validation |
|---|---|---|
| Weak STT accuracy for some languages, especially lower-resource ones such as Malayalam or Tamil | Incorrect translations | Test varied speakers, accents, and noisy environments per language |
| Too many language combinations to validate | Broken or poor-quality pairs | Enable a language or direction only after verification; mark others unavailable or experimental |
| Poor translation quality | Meaning may change | Build a representative evaluation set and review translations |
| Voice cloning unavailable for a language | Generic voice may be required | Validate providers early and define a fallback |
| High processing latency | Conversation feels unnatural | Use streaming components and measure each pipeline stage |
| Audio feedback or echo | Poor call quality | Use echo cancellation, audio routing controls, and headphones during testing |
| Overlapping speakers | Lost or confused speech | Define turn-taking and interruption behavior for the MVP |
| Third-party service cost | Operating cost may grow | Track cost per call minute and impose usage limits |
| Voice misuse or data exposure | Privacy and trust risk | Consent, access controls, retention limits, and deletion workflow |
| Cross-tenant data exposure | Serious privacy and trust incident | Workspace-scoped queries and authorization tests |
| Usage metering errors | Wrong cost attribution or billing | Idempotent event-based metering and reconciliation against provider invoices |

## 12. MVP Acceptance Criteria

Phase 1 can be considered ready for controlled user testing when:

- Two users can join the same audio room.
- Each user can select a speaking language and a listening language from the supported-language list.
- For every enabled language combination, a user can speak and the other participant receives translated audio in the language they chose to hear.
- For the first validated pair, Malayalam → Tamil and Tamil → Malayalam both work.
- If the speaker's language matches the receiver's listening language, the original audio is delivered without translation.
- Unsupported language combinations are blocked before the call with a clear message.
- Each participant hears the other participant in the language that participant (the receiver) chose.
- A call has exactly two participants, both registered users, and a third person cannot join.
- Call usage is recorded against the call creator's workspace, and plan limits are enforced with a clear message.
- Translation starts automatically without a manual translate action.
- Both directions can operate during the same call.
- Users can mute, unmute, and end the call.
- The application handles microphone permission and common connection failures.
- Original audio and translated audio are not unintentionally mixed.
- Voice-profile consent and deletion behavior work if voice cloning is enabled.
- Latency, recognition quality, translation quality, and speech naturalness have been measured and documented.
- A standard generated-voice fallback exists if voice cloning is unsupported or unavailable.

## 13. Development Milestones

| # | Milestone | Deliverable |
|---:|---|---|
| 1 | Product and technical validation | Confirm provider support, language coverage, licensing, and expected costs |
| 2 | Web application foundation | React frontend, FastAPI backend, authentication, and call-room flow |
| 3 | Basic audio calling | Two-user WebRTC audio call without translation |
| 4 | Speech pipeline prototype | STT, translation, and speech generation tested independently |
| 5 | One-way translated call | Malayalam-to-Tamil end-to-end audio (first validated pair) |
| 6 | Reverse direction | Tamil-to-Malayalam end-to-end audio |
| 7 | Voice profile experiment | Consent-based voice enrollment and cross-lingual voice test |
| 8 | Integrated MVP | Bidirectional calling, controls, error handling, and latency measurement |
| 9 | SaaS foundations | Workspaces, tenant isolation, usage metering, plan limits, and a usage view |
| 10 | Controlled testing | Test one-to-one calls with real speakers and refine quality and performance |
| 11 | Language expansion | Add further languages through the language registry after per-language and per-direction validation |
| 12 | Guest access via link (deferred) | Guest link, guest join screen with receiver-chosen language, and scoped guest tokens, only after Phase 1 is validated |
| 13 | SaaS commercialization | Subscription plans, billing, team management, and admin dashboard (to be confirmed) |
| 14 | Phase 2 discovery | Technical proof of concept for video and lip-sync |

Milestone dates and delivery estimates will be defined after provider selection and the first latency/quality prototype.

## 14. Success Metrics

Track the following during testing:

- Speech recognition accuracy for each supported language (first: Malayalam and Tamil).
- Translation quality judged by native speakers.
- Time from end of phrase to translated audio playback.
- Percentage of speech successfully processed.
- Call connection success rate.
- Audio interruption and failure rate.
- Voice similarity and naturalness ratings, where voice cloning is enabled.
- Cost per call minute.
- User ability to understand the translated conversation without assistance.
- Translated minutes and cost per workspace compared with plan limits.
- Limit-reached and abuse events.

## 15. Assumptions and Open Decisions

These decisions are not yet confirmed and must remain open until explicitly decided:

1. ~~Whether users must create an account before calling.~~ **Resolved in v1.5:** in Phase 1 both participants are registered users. Guest access is deferred (section 5.4).
2. Whether calls use invite links, room codes, or both (the invited person is a registered user in Phase 1).
3. Whether voice enrollment is optional or required.
4. Which STT, translation, and speech-generation providers meet the language requirements.
5. Whether translated captions are part of the first MVP.
6. Whether call audio is processed only in memory or temporarily buffered by services.
7. Hosting region, deployment platform, and expected concurrent users.
8. Initial latency and quality thresholds.
9. Whether the first release is a private prototype or a public beta.
10. Whether WebRTC infrastructure will be managed, self-hosted, or selected after the prototype.
11. ~~Whether both callers need accounts or guest joining is allowed.~~ **Resolved in v1.5:** both callers need accounts; guest joining is deferred.
12. Which audio output modes will be available in the first release.
13. Which languages beyond Malayalam and Tamil are enabled at launch, and how the supported-language list grows.
14. Whether translation may pivot through a common language (for example English) when direct translation between two languages is unavailable or low quality.
15. Whether users can change speaking or listening language during a call.
16. Whether the speaking language is always selected by the user or can be detected automatically.
17. How unsupported or experimental languages are presented to users.
18. SaaS pricing model and plans (free tier, trial, pay-as-you-go minutes, subscription).
19. Payment provider, and whether billing is introduced during Phase 1 or after validation.
20. Whether Phase 1 includes teams with multiple members per workspace or only single-owner accounts.
21. (Deferred, section 5.4.) Guest link policy: expiry time, whether a link can be reused for several calls, and whether the host must approve guests (waiting room).
22. (Deferred, section 5.4.) Whether a guest can optionally enroll a voice profile or always uses the standard voice.
23. Whether workspaces can offer API access or an embeddable widget.
24. Data residency and compliance commitments for customers.
25. (Deferred, section 5.4.) Whether guest usage is always billed to the host's workspace.

## 16. Current Implementation Status

This section tracks the work currently discussed in the project. Update it as implementation progresses.

### Frontend

- [x] Vite React project created.
- [x] Tailwind CSS 4.3.5 installed (reported by project owner).
- [x] Confirm the Vite Tailwind plugin configuration.
- [x] Confirm the project uses the React + TypeScript template.
- [x] Install/verify React Router, Axios, and Lucide React.
- [x] Implement Login page in `Login.tsx`.
- [x] Implement registration page in `Register.tsx`.
- [x] Implement authenticated routing and session handling.
- [x] Implement dashboard and call-room UI with WebRTC audio controls and live captions.
- [x] Implement voice cloning consent and profile management (`VoiceProfile.tsx`).
- [x] Update speaking and listening language selection to use the supported-language list instead of a fixed Malayalam-Tamil pair.

### Backend

- [x] Create FastAPI project modular layout.
- [x] Define authentication and user APIs.
- [x] Define language preference APIs.
- [x] Generalize language preferences into a supported-language registry with per-language capability flags (speech recognition, translation, speech generation, voice cloning) and server-side validation of speaking/listening combinations.
- [x] Define call-room and signaling flow with WebSockets.
- [x] Enforce exactly two participants per call and reject a third participant (`CALL_FULL`).
- [x] Make each receiver's listening language drive the translation direction in the call pipeline for both participants (receiver-driven routing).
- [x] Prototype STT, translation, and TTS integrations and interfaces.

### Validation

- [ ] Validate Malayalam and Tamil STT (first language pair).
- [ ] Validate both translation directions.
- [ ] Define the checklist for enabling each additional language.
- [ ] Validate multilingual speech generation.
- [ ] Test consent-based cross-lingual voice preservation.
- [ ] Measure end-to-end latency and cost.

### SaaS foundations

- [x] Introduce workspaces and tenant-scoped data access.
- [x] Implement usage metering (minutes per call, direction, and stage).
- [x] Implement plan limits and quota messages (`WORKSPACE_QUOTA_EXCEEDED`).
- [x] Add rate limits and concurrency caps per workspace and per user (strictly 2 participants, workspace quota check).
- [ ] Decide pricing, plans, and payment provider before the commercialization milestone.

## 17. Final Scope Summary

**Phase 1:** Build a web-based, strictly one-to-one (exactly two participants), bidirectional audio communication application in which each of the two participants chooses the language they speak and the language they want to hear (the receiver always decides what they hear), with automatic speech recognition, translation, and translated speech playback. Malayalam–Tamil is the first language pair to be validated; additional languages are enabled as support is verified for each language. Evaluate consent-based cross-lingual voice cloning and provide a standard-voice fallback.

**Product model:** Deliver Phase 1 as a SaaS product. Accounts own a workspace and invite one other registered user to a one-to-one call; usage is metered and limited per plan. Guest access and group calls are deferred. Billing, teams, admin tooling, and API/widget access are proposed SaaS commercialization work to be confirmed.

**Phase 2:** Add live video calling and investigate synchronized translated lip-sync after the audio experience meets agreed quality and latency requirements.

**Core principle:** Validate the complete audio experience first. Do not begin full video and lip-sync development until the audio pipeline is reliable, understandable, and practical to operate.

## 18. Revision History

| Version | Change |
|---|---|
| 1.1 | Initial working scope (Malayalam and Tamil audio translation). |
| 1.2 | Generalized from a fixed Malayalam–Tamil pair to user-selected speaking and listening languages. Malayalam–Tamil remains the first validated pair. Added supported-language registry, per-language validation, and related open decisions. |
| 1.3 | Defined the product as SaaS. The receiver always chooses the language they hear. Added guest-link access (no account needed), SaaS requirements (workspaces, usage metering, plan limits, commercialization), new milestones, risks, acceptance criteria, metrics, and open decisions. |
| 1.4 | Made the guest-link requirement explicit: a guest receives audio in the language they choose on the join screen, independent of the host's settings. Added an example table and unsupported-language behavior. |
| 1.5 | Narrowed Phase 1 to strictly one-to-one calls between two registered users. Guest access moved out of Phase 1 into a deferred section (5.4); group and many-to-many calls stay out of scope. Related milestones, risks, acceptance criteria, metrics, open decisions, and status updated. |
