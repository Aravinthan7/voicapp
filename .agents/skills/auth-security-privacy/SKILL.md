---
name: auth-security-privacy
description: Authentication, authorization, secrets handling, transport security, and privacy requirements for VoiceApp, including no-default-recording, third-party AI disclosure, and data deletion. Use when implementing login/registration, tokens, room access control, logging, or anything that handles personal data or audio.
---

# Auth, Security & Privacy

Maps to scope section 10 (Security and privacy). Voice is biometric-adjacent data: default to the most conservative option.

## Authentication
- Passwords hashed with **argon2id** (or bcrypt with a sane cost); never log or return them. Enforce minimum length, rate-limit login and registration, return the same message for unknown-email and wrong-password.
- Short-lived access JWT (~15 min) + rotating refresh token. Validate `exp`, `iss`, `aud`; keep the signing secret in env.
- Token storage in the browser is a trade-off: **httpOnly + Secure + SameSite cookie** (preferred; needs CSRF protection) vs `localStorage` (simpler, XSS-exposed). Ask the user before committing; if `localStorage`, keep the XSS surface small (no `dangerouslySetInnerHTML`, no untrusted HTML, strict CSP).
- Both participants are registered users in Phase 1. Guest access is **deferred** (scope 5.4); if it is built later, use short-lived single-room guest tokens that never reach account endpoints - see `saas-workspaces-guest-access`.

## Authorization
- Every call/voice-profile endpoint checks ownership or membership server-side. A user may only read/delete their own voice profile and may only join rooms they were invited to.
- Room codes and invite tokens: cryptographically random (`secrets.token_urlsafe`), sufficiently long, expiring, rate-limited on lookup, and capped at 2 participants.
- WebSocket and signaling messages are authorized per room; ignore/close on messages from non-members.

## Secrets & config
- Provider API keys (STT/translation/TTS/voice cloning) exist **only in backend env**. Never in frontend code, `VITE_*` vars, responses, logs, or git. Keep `.env` git-ignored and commit `.env.example` with placeholders.
- Frontend must call the backend, never a provider directly. Don't hand out provider credentials to clients; if a provider needs a client token, mint a narrowly scoped, short-lived one server-side.

## Transport & hardening
HTTPS/WSS everywhere outside local dev; WebRTC media is DTLS-SRTP by default (do not disable). Strict CORS origins, security headers, input size limits (audio chunk and WS message size), request rate limiting, and dependency auditing (`npm audit`, `pip-audit`).

## Privacy requirements (non-negotiable)
1. **Do not record or retain call audio by default.** Process in memory; if a provider buffers audio, document it (open decision) and prefer providers with zero/short retention.
2. No full transcript history in Phase 1; captions, if any, are ephemeral.
3. Disclose in the UI that speech is processed by third-party AI services, name the retention behavior, and link to the policy text.
4. Voice samples/profiles: explicit consent first, restricted access, encrypted at rest, user-triggered deletion that also deletes the provider-side voice. See `voice-profile-consent`.
5. Logs: never include audio, transcripts, tokens, voice sample paths with PII, or full emails. Log IDs and metrics (latency, provider, status) instead.
6. Account deletion removes personal data and voice assets, and revokes provider voices.
7. Label AI-generated/translated audio so users aren't misled about who is "speaking".

## Review checklist
- [ ] No secret in source, bundle, or logs
- [ ] Every endpoint has an authz test (other user's id -> 403/404)
- [ ] Rate limits on auth, room join, and provider-backed endpoints (also protects cost)
- [ ] Deletion paths tested
- [ ] Privacy/disclosure copy present in UI
