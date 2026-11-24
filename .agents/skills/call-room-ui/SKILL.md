---
name: call-room-ui
description: Building the VoiceApp call experience in React - call room page, mute/end controls, participant and connection status, translation status, original-vs-translated audio indicators, captions, microphone permission flow, and error/reconnect states. Use when working on CallRoom.tsx, components/call, device handling, or call accessibility.
---

# Call Room UI

Implements scope sections 5.1 D, F, G, H and the accessibility requirements. Pair with `webrtc-signaling-audio` (transport) and `translation-pipeline` (status events).

## Components (src/components/call/)
`CallControls` (mute, end, output mode), `ParticipantTile` (name, speaking indicator, language), `ConnectionStatusBadge`, `TranslationStatusIndicator`, `AudioSourceBadge`, `CaptionsPanel` (optional), `MicPermissionGate`, `CallErrorBanner`, `RoomInfo` (invite link / room code copy for the caller; each participant's speaking and listening language). `pages/CallRoom.tsx` composes them and owns no business logic - hooks do.

## Hooks
- `useMediaDevices()` - `getUserMedia` with `{ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }`, exposes `status: 'idle' | 'prompting' | 'granted' | 'denied' | 'unavailable'`, device list, `stop()`. Always stop tracks on unmount.
- `useCallSession(roomId)` - connection state machine (`idle -> connecting -> connected -> reconnecting -> ended | failed`), participants, mute state.
- `useCallEvents()` - subscribes to the WebSocket events (translation status, captions, participant join/leave, errors).
Keep effects minimal and always return cleanup (close peer connection, socket, tracks).

## Required UI states (must all be designed, not just the happy path)
| Situation | UI |
|---|---|
| Mic permission not yet asked | Explain *why* before the browser prompt (MicPermissionGate) |
| Permission denied | Plain-language steps to re-enable in browser settings + retry button |
| No mic / device in use | Distinct message from "denied" |
| Waiting for the other participant | Caller: invite link/room code + copy button; invitee: "Waiting for [caller]" |
| Call is full (third person tries to join) | Clear "This call is full" message; no audio, no join |
| Connecting / reconnecting | Badge + non-blocking message; keep call controls usable |
| Other participant disconnected | Say so; offer wait or end call |
| STT / translation / TTS failure | Show "translation unavailable"; never fail silently; offer fall back to original audio |
| Rate limit / quota exceeded | Clear message, no retry storm |
| Unsupported language pair / voice profile | Block before call start with explanation |

## Audio-source clarity (a core requirement)
- Default output = translated audio. Provide a toggle to original audio and a toggle to disable voice imitation (standard generated voice).
- Always show which is playing: badge such as "Translated (AI voice)" vs "Original". Indicate when imitated voice is in use.
- Never play original and translated simultaneously by default. When translated audio plays, duck or mute the original track (see `translation-pipeline`).
- Show a one-time/ambient disclosure that audio is processed by third-party AI services, with a link to the privacy text.

## Status and captions
- Translation status per direction: `listening | processing | speaking | delayed | unavailable`.
- Captions (open decision - build behind a feature flag): show recognized text and translation, partial results visually distinct (muted/italic) from finalized ones, `aria-live="polite"`, keep only a short in-memory window (no transcript history in Phase 1).
- Headphones tip near the start of a call (echo risk).

## Accessibility
- Mute is a toggle button with `aria-pressed` and an accessible name that states the action ("Mute microphone"); `M` shortcut optional but must not trigger while typing.
- Status changes announced via `aria-live`; do not rely on color alone (icon + text).
- Visible focus rings, 44px touch targets, works at 320px width. Use lucide icons (`Mic`, `MicOff`, `PhoneOff`, `Languages`, `Wifi`, `WifiOff`) with labels.
- Autoplay policy: start remote audio playback from a user gesture (the "Join call" click) and handle `play()` rejection with a visible "Tap to enable audio" prompt.
- Malayalam/Tamil text: ensure the font stack renders both scripts (add a Noto Sans Malayalam/Tamil fallback to the font family) and test captions with real text.

## Done when
Every row in the state table is reachable and tested manually; mute/end work from keyboard; no console errors; media tracks and sockets are released on leaving the page.
