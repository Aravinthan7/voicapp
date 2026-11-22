---
name: webrtc-signaling-audio
description: WebRTC audio calling and WebSocket signaling for VoiceApp - room lifecycle, offer/answer/ICE exchange, STUN/TURN, media-server (SFU) evaluation, mute, echo cancellation, reconnection, and where translated audio enters the media path. Use when building or debugging two-person audio calls, signaling messages, or call media routing.
---

# WebRTC & Signaling

Milestone 3 is **plain two-user audio calling without translation**. Get it solid before adding the translation pipeline.

## Architecture status
The media-routing design (client-side, server-side, or hybrid) is **unvalidated** and must be decided in the technical prototype. Evaluate an existing SFU/managed option (e.g. LiveKit, mediasoup, Janus, or a managed service) before building media infrastructure. Don't hand-roll an SFU. Keep the transport behind an interface so the choice can change.

Likely shape for translation: the server (or media server) needs to receive each speaker's audio to run STT, then deliver generated speech to the *other* participant. Two candidate designs to prototype and measure:
1. **Server-side branch:** speaker's audio -> media server -> pipeline; translated audio returned as a separate track/stream to the receiver; receiver's client chooses which track to play.
2. **Client-side capture:** speaker's client streams mic audio to a backend WS endpoint (e.g. 16 kHz PCM / Opus chunks) in parallel with the P2P/SFU stream; translated audio returns via WS or a WebRTC track.
Record the measured latency and complexity of whichever is tried in the repo docs.

## Signaling over WebSocket (`/ws/calls/{roomId}`)
Typed envelope: `{ type, payload, seq }`. Message types: `join`, `peer-joined`, `peer-left`, `offer`, `answer`, `ice-candidate`, `mute-state`, `output-mode`, `translation-status`, `caption`, `error`, `ping/pong`, `end-call`.
- Server relays signaling only between room members; room capacity = 2 (reject a third with a clear error).
- Use "perfect negotiation" (polite/impolite peer) to avoid offer collisions; trickle ICE.
- Heartbeat + server-side timeout to detect dead peers; mark participant disconnected and notify the other side.

## Client rules (React)
- Wrap `RTCPeerConnection` in a hook/class under `hooks/` or `services/`; one connection per call; close it, stop tracks, and close the socket on unmount/end.
- Mic constraints: `echoCancellation`, `noiseSuppression`, `autoGainControl` true. Mono audio is enough.
- Mute = `track.enabled = false` (keeps the connection), and signal `mute-state` so the UI and pipeline pause STT during mute.
- Remote audio plays through an `<audio autoPlay playsInline>` element started after a user gesture; handle `play()` rejection.
- Monitor `connectionState` / `iceConnectionState`; on `disconnected` try ICE restart, then renegotiate; surface `reconnecting`/`failed` to the UI (`call-room-ui`).
- Use `getStats()` to log round-trip time, jitter, packet loss for the metrics in `quality-metrics-testing`.

## Network
Configure STUN and **TURN** (needed for many real networks/mobile carriers). TURN credentials come from the backend, short-lived (HMAC/time-limited), never hard-coded in the bundle. Budget for TURN bandwidth in cost tracking.

## Echo and feedback (key risk)
Original audio + translated audio + speakers = feedback. Mitigate: browser AEC, per-participant playback routing, recommend headphones, and never loop the receiver's translated output back into the sender's capture path.

## Turn-taking
Define MVP behavior for overlapping speech and interruptions (e.g. finish current translated utterance, or barge-in cancels queued playback). Document the choice; see `translation-pipeline`.

## Verify
Two browsers (and one on mobile) join the same room, hear each other, mute/unmute works, ending the call releases mic indicator, killing network on one side leads to reconnect or a clear failure state on both.
