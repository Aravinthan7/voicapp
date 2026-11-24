---
name: database-redis-state
description: PostgreSQL schema design, migrations, and Redis transient-state usage for VoiceApp - users, language preferences, call rooms, voice profile metadata, consent records, room/presence state. Use when designing tables, writing models or migrations, or deciding what belongs in Postgres vs Redis.
---

# Database & Redis State

## Split of responsibility
- **PostgreSQL** (durable): users, profiles, language preferences, call room records (id, code, status, created/ended times, participant ids), voice-profile *metadata* and consent records, usage/cost counters.
- **Redis** (transient, TTL'd): live room presence, WebSocket connection registry, short-lived join codes, rate-limit counters, pipeline session state, refresh-token denylist. Anything lost on Redis restart must be reconstructible or acceptable to lose.
- **Neither**: raw call audio, full transcripts (Phase 1 out of scope; no recording by default).

## Suggested tables (adapt to the existing `models/`)
- `users` - id (UUID), email (unique, lowercased), password_hash, display_name, speaking_language, listening_language, created_at, deleted_at.
- `call_rooms` - id, code (unique, high-entropy), created_by, status (`waiting|active|ended`), per-participant language snapshot (speaking/listening), created_at, ended_at.
- `call_participants` - room_id, user_id, speaking_language, listening_language, disclosure_acknowledged_at, joined_at, left_at. Exactly 2 participants per call (enforce atomically). The receiver's `listening_language` here drives the translation direction. (Deferred guest access would add nullable user_id, is_guest, display_name.)
- `voice_profiles` - id, user_id, provider, provider_voice_id, status (`pending|ready|failed|deleted`), languages_supported, created_at, deleted_at.
- `voice_consents` - id, user_id, voice_profile_id, consent_text_version, granted_at, revoked_at, ip/user-agent hash if needed for audit.
- `workspaces` (id, name, plan_id), `workspace_members` (workspace_id, user_id, role), `plans` (limits as data). Add `workspace_id` to `call_rooms`, `voice_profiles`, `usage_events`.
- `guest_links` (**deferred**, only when guest access is built) - id, call_id, token_hash (never the raw token), expires_at, revoked_at, created_by.
- `usage_events` (required for SaaS metering) - workspace_id, call_id, participant_id, direction, stage, provider, unit, quantity, estimated_cost, idempotency_key (unique). See `saas-workspaces-guest-access`.

Language values: store as BCP-47 codes (e.g. `ml-IN`, `ta-IN`, `hi-IN`, `en-IN`). Keep a `languages` registry table (code, English name, native name, enabled flag, capability flags such as `stt`, `translation_source`, `tts_target`, `voice_cloning`) and validate every user's speaking/listening language against it; derive allowed (source, target) directions from the capabilities. Never hard-code `ml-IN`/`ta-IN` as column defaults or pair constants.

## Rules
1. Async SQLAlchemy 2.x, one session per request via dependency; commit in the service layer.
2. **Alembic** for all schema changes; never edit the DB by hand or rely on `create_all` outside local dev.
3. UUID primary keys; timestamps in UTC (`timestamptz`).
4. Soft-delete only where needed; **voice samples and provider voice profiles must be hard-deletable** and deletion must be verifiable (see `voice-profile-consent`).
5. Never store provider API keys in the DB. Store voice samples (if retained at all) in access-controlled object storage with encryption, not in Postgres rows or a public path.
6. Index foreign keys and lookup columns (`call_rooms.code`, `users.email`).
7. Redis keys are namespaced and always have TTLs: `room:{id}:presence`, `ws:{user_id}`, `ratelimit:{scope}:{id}`. Use atomic ops (`INCR`+`EXPIRE`, Lua, or `SET NX EX`) for counters and locks.
8. Handle room-ending races: ending a room is idempotent; presence cleanup runs on both explicit end and connection timeout.

## Verify
Migration applies up and down on an empty DB; models match migrations; tests use a throwaway DB/fakeredis; `.env.example` lists `DATABASE_URL` and `REDIS_URL` with dummy values.
