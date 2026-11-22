# Multilingual Voice Communication Platform

**Document type:** Project scope and implementation guide  
**Version:** 1.1  
**Status:** Working project document  
**Current focus:** Phase 1 — audio-only web application

---

## 1. Project Overview

Build a web application that allows two people who speak different languages to communicate through a live audio call.

The first supported language pair is Malayalam and Tamil:

- Person A speaks Malayalam and hears the other person's speech translated into Malayalam.
- Person B speaks Tamil and hears the other person's speech translated into Tamil.
- Translated speech should ideally resemble the original speaker's voice, subject to the capabilities of the selected speech-generation technology and the speaker's explicit consent.
- Translation and playback should happen automatically during the call without requiring a manual translate action for every sentence.

**Phase 1 is audio calling only.** Video calling and translated lip-sync are future work and must not delay validation of the audio experience.

## 2. Product Vision

Make conversations between people who speak different languages feel as natural and effortless as a regular voice call.

Longer-term possibilities include additional Indian and international languages, video calls, and synchronized translated lip movements.

## 3. Goals

### Phase 1 goals

1. Build a responsive web application.
2. Allow two users to join the same audio call.
3. Capture each participant's microphone audio.
4. Recognize speech in the speaker's language.
5. Translate recognized speech into the other participant's selected language.
6. Generate translated speech audio.
7. Deliver translated audio to the receiver automatically.
8. Evaluate whether generated speech can resemble the original speaker's authorized voice.
9. Provide basic call controls and clear connection/error states.
10. Measure translation quality and end-to-end delay.

### Long-term goals

- Add live video calling.
- Add translated lip-sync or visual mouth-movement adaptation.
- Support more language pairs.
- Improve naturalness, emotion, accent handling, and speech timing.
- Consider mobile applications after validating the web experience.

## 4. Initial Users and Main Use Case

### Initial users

- Malayalam speakers
- Tamil speakers

### Main use case

A Malayalam-speaking user and a Tamil-speaking user join the same call.

1. The Malayalam speaker talks naturally.
2. The system recognizes Malayalam speech.
3. The system translates it into Tamil.
4. The system generates Tamil speech, optionally conditioned on the Malayalam speaker's authorized voice profile.
5. The Tamil-speaking receiver hears the translated audio.
6. The same process runs in the opposite direction.

Both directions should operate independently and support normal conversational turn-taking.

## 5. Phase 1 Scope — Audio Web Application

### 5.1 Included features

#### A. User access

- User registration and login.
- User profile with display name.
- Language preference settings.
- Microphone permission guidance.

#### B. Language settings

- Select the user's speaking language.
- Select the language they want to hear.
- Initial supported pair: Malayalam and Tamil.
- Validate supported language combinations before starting a call.

#### C. Voice profile enrollment

- Allow a user to provide a voice sample only with explicit consent.
- Create or configure a voice profile using a compatible voice-generation service.
- Provide sample playback or a test step where supported.
- Allow users to re-record or delete their voice sample/profile.
- Use only the voice of the consenting user.
- If reliable voice cloning is unavailable for the selected language pair, provide a clearly labeled standard generated-voice fallback.

Voice enrollment does not necessarily require training a new AI model for every user. The implementation may use a provider's voice-cloning or speaker-conditioning feature.

#### D. Audio call management

- Create a call room.
- Join a call using an invite link or room code.
- Support two participants in the initial release.
- Start and end a call.
- Mute and unmute the microphone.
- Display participant and connection status.
- Handle microphone permission denial and network interruption.

#### E. Real-time speech translation pipeline

For each participant, independently:

1. Capture microphone audio.
2. Stream audio to the speech-processing pipeline.
3. Perform speech recognition (STT).
4. Translate recognized speech into the receiver's language.
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
- Selected language pair.
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

### 5.2 Out of scope for Phase 1

- Video calling.
- Lip-sync or facial animation.
- Group calls with more than two participants.
- Native mobile applications.
- Public social feed, messaging, or contact discovery.
- Call recording by default.
- Full call transcription history.
- User-created custom AI models or training a foundation model.
- Guaranteed preservation of the speaker's exact accent, emotion, and vocal identity in every target language.

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
| Deployment | To be selected after prototype and cost evaluation |

### Architecture approach

Use a modular FastAPI backend initially rather than splitting the application into microservices prematurely.

- React is responsible for the user interface and browser-side call experience.
- WebRTC is the proposed real-time media transport.
- WebSockets are used for signaling and application events.
- FastAPI provides authentication, user/profile settings, call coordination, and integration with speech services.
- Speech processing is organized as independent pipelines for each translation direction.
- Evaluate an existing WebRTC media server/SFU or managed option for the MVP instead of building media infrastructure from scratch.
- The final media-routing design (client-side, server-side, or a combination) must be validated in the technical prototype.

### Speech pipelines

**Malayalam → Tamil**

`Malayalam microphone audio → Streaming STT → Malayalam text → Tamil translation → Tamil speech generation → Person B playback`

**Tamil → Malayalam**

`Tamil microphone audio → Streaming STT → Tamil text → Malayalam translation → Malayalam speech generation → Person A playback`

### Provider evaluation checklist

For every speech or voice provider/model, verify:

- Explicit Malayalam speech recognition support.
- Explicit Tamil speech recognition support.
- Malayalam-to-Tamil and Tamil-to-Malayalam translation quality.
- Target-language speech generation quality.
- Cross-lingual voice cloning support for both languages.
- Streaming or chunked audio support.
- End-to-end latency.
- Commercial usage rights and licensing.
- Data retention, privacy, and deletion policies.
- Pricing, rate limits, and concurrency limits.

Do not assume that a model supports Malayalam or Tamil voice cloning merely because it supports multilingual speech generation.

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

### Accessibility and usability

- Make microphone and call controls easy to understand.
- Clearly distinguish original audio from translated audio.
- Provide understandable permission and error messages.
- Design for desktop and mobile browsers, subject to browser audio limitations.

## 11. Key Risks and Constraints

| Risk | Impact | Mitigation / validation |
|---|---|---|
| Weak Malayalam or Tamil STT accuracy | Incorrect translations | Test varied speakers, accents, and noisy environments |
| Poor translation quality | Meaning may change | Build a representative evaluation set and review translations |
| Voice cloning unavailable for a language | Generic voice may be required | Validate providers early and define a fallback |
| High processing latency | Conversation feels unnatural | Use streaming components and measure each pipeline stage |
| Audio feedback or echo | Poor call quality | Use echo cancellation, audio routing controls, and headphones during testing |
| Overlapping speakers | Lost or confused speech | Define turn-taking and interruption behavior for the MVP |
| Third-party service cost | Operating cost may grow | Track cost per call minute and impose usage limits |
| Voice misuse or data exposure | Privacy and trust risk | Consent, access controls, retention limits, and deletion workflow |

## 12. MVP Acceptance Criteria

Phase 1 can be considered ready for controlled user testing when:

- Two users can join the same audio room.
- A Malayalam-speaking user can speak and the other user receives Tamil translated audio.
- A Tamil-speaking user can speak and the other user receives Malayalam translated audio.
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
| 5 | One-way translated call | Malayalam-to-Tamil end-to-end audio |
| 6 | Reverse direction | Tamil-to-Malayalam end-to-end audio |
| 7 | Voice profile experiment | Consent-based voice enrollment and cross-lingual voice test |
| 8 | Integrated MVP | Bidirectional calling, controls, error handling, and latency measurement |
| 9 | Controlled testing | Test with real speakers and refine quality and performance |
| 10 | Phase 2 discovery | Technical proof of concept for video and lip-sync |

Milestone dates and delivery estimates will be defined after provider selection and the first latency/quality prototype.

## 14. Success Metrics

Track the following during testing:

- Speech recognition accuracy for Malayalam and Tamil.
- Translation quality judged by native speakers.
- Time from end of phrase to translated audio playback.
- Percentage of speech successfully processed.
- Call connection success rate.
- Audio interruption and failure rate.
- Voice similarity and naturalness ratings, where voice cloning is enabled.
- Cost per call minute.
- User ability to understand the translated conversation without assistance.

## 15. Assumptions and Open Decisions

These decisions are not yet confirmed and must remain open until explicitly decided:

1. Whether users must create an account before calling.
2. Whether calls use invite links, room codes, or both.
3. Whether voice enrollment is optional or required.
4. Which STT, translation, and speech-generation providers meet the language requirements.
5. Whether translated captions are part of the first MVP.
6. Whether call audio is processed only in memory or temporarily buffered by services.
7. Hosting region, deployment platform, and expected concurrent users.
8. Initial latency and quality thresholds.
9. Whether the first release is a private prototype or a public beta.
10. Whether WebRTC infrastructure will be managed, self-hosted, or selected after the prototype.
11. Whether both callers need accounts or guest joining is allowed.
12. Which audio output modes will be available in the first release.

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

### Backend

- [x] Create FastAPI project modular layout.
- [x] Define authentication and user APIs.
- [x] Define language preference APIs.
- [x] Define call-room and signaling flow with WebSockets.
- [x] Prototype STT, translation, and TTS integrations and interfaces.

### Validation

- [ ] Validate Malayalam and Tamil STT.
- [ ] Validate both translation directions.
- [ ] Validate multilingual speech generation.
- [ ] Test consent-based cross-lingual voice preservation.
- [ ] Measure end-to-end latency and cost.

## 17. Final Scope Summary

**Phase 1:** Build a web-based, two-person, bidirectional Malayalam–Tamil audio communication application with automatic speech recognition, translation, and translated speech playback. Evaluate consent-based cross-lingual voice cloning and provide a standard-voice fallback.

**Phase 2:** Add live video calling and investigate synchronized translated lip-sync after the audio experience meets agreed quality and latency requirements.

**Core principle:** Validate the complete audio experience first. Do not begin full video and lip-sync development until the audio pipeline is reliable, understandable, and practical to operate.
