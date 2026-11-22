---
name: fastapi-backend
description: FastAPI backend conventions for VoiceApp - modular monolith layout, routers, Pydantic schemas, dependency injection, async patterns, config via environment, error format, WebSocket endpoints, and provider-adapter interfaces. Use when creating or changing anything under backend/.
---

# FastAPI Backend

Backend is currently a skeleton (`backend/app/main.py` empty, requirements file named `requirement.txt`). Inspect the tree first.

## Actual folders vs. proposed
The scope proposes `services/`, `db/`, `websocket/`, `webrtc/`. The repo has `api/ core/ database/ models/ schemas/ service/ speech/`. **Follow what exists**; add `websocket/` and `webrtc/` when those features start. Don't rename existing folders without asking. Suggested mapping:
- `api/routes/` - thin routers: `auth.py`, `users.py`, `languages.py`, `calls.py`, `voice_profiles.py`
- `core/` - `config.py` (pydantic-settings), `security.py`, logging, exceptions
- `database/` - engine/session, Alembic migrations
- `models/` - SQLAlchemy ORM; `schemas/` - Pydantic request/response models
- `service/` - business logic (users, calls, voice profiles)
- `speech/` - `stt/`, `translation/`, `tts/` adapters + pipeline (see `translation-pipeline`)

## Rules
1. Modular monolith. No microservices, no premature abstraction beyond provider adapters.
2. Routers only parse/validate and delegate to `service/`; no DB or provider calls inside route functions.
3. Pydantic v2 schemas for every request and response; never return ORM objects or password hashes. Separate `Create`/`Update`/`Read` schemas.
4. Async end to end for I/O (async SQLAlchemy, `httpx.AsyncClient`, async Redis). Never block the event loop with CPU work or sync SDK calls - use `run_in_executor` or a worker.
5. Dependencies via `Depends` (db session, current user, settings, provider clients) so tests can override them.
6. Config only from environment (`pydantic-settings`), with `.env.example` committed and `.env` git-ignored. Fail fast at startup if a required secret is missing. Never log secrets, tokens, audio bytes, or full transcripts.
7. Consistent error body `{ "error": { "code": "...", "message": "..." } }` with stable machine codes (e.g. `UNSUPPORTED_LANGUAGE_PAIR`, `PROVIDER_UNAVAILABLE`, `RATE_LIMITED`) the frontend can map to messages.
8. CORS: explicit origins from config, not `*`, when credentials are used.
9. Version the API under `/api/v1`. Health endpoint `/health` (and `/ready` checking DB/Redis).
10. Add a `requirements.txt`-style pinned file; if renaming `requirement.txt`, tell the user.

## Initial endpoints (Phase 1)
`POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET/PATCH /users/me` (display name, speaking language, listening language), `GET /languages` (supported pairs), `POST /calls` (create room), `POST /calls/join` (code/invite), `POST /calls/{id}/end`, `GET/POST/DELETE /voice-profiles/...`, WS `/ws/calls/{id}`.
Validate the language pair server-side on call creation/join; the frontend check is only UX.

## WebSocket endpoints
Authenticate on connect (token in first message or subprotocol/query - not logged URLs), verify the user belongs to the room, define a typed message envelope `{ "type": str, "payload": {...}, "seq": int }`, enforce message size limits, heartbeat/ping, clean up room state on disconnect. See `webrtc-signaling-audio`.

## Provider adapters
Define `Protocol`/ABC interfaces (`SpeechToText`, `Translator`, `TextToSpeech`, `VoiceProfileProvider`) in `speech/`; concrete providers implement them and are chosen by config. This keeps the undecided provider choice swappable and testable with fakes.

## Testing
`pytest` + `pytest-asyncio` + `httpx.AsyncClient`/FastAPI `TestClient`; override dependencies; fake providers; WebSocket tests with `client.websocket_connect`. See `quality-metrics-testing`.

## Verify
App imports and starts (`uvicorn app.main:app --reload` from `backend/`), `/docs` loads, tests pass, no secrets in repo.
