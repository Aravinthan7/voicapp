---
name: saas-workspaces-guest-access
description: SaaS foundations for VoiceApp - the strict one-to-one (exactly two registered participants) call rule, workspaces and tenant isolation, usage metering, plan limits, abuse/cost protection - plus the DEFERRED guest-link design (not part of Phase 1). Use when building call capacity rules, workspace/tenant data access, usage events, quotas, or when someone asks about guest links.
---

# SaaS Workspaces, One-to-One Calls & (Deferred) Guest Access

Implements `Project_scope.md` sections 5.1 I (one-to-one only), 5.3 (SaaS requirements), 5.4 (**deferred** guest access) and 10 (Multi-tenancy and SaaS operations), scope v1.5. Pricing, plans, payment provider are **open decisions** (section 15, items 18-25): isolate them behind config/interfaces and state your assumption.

## Core rules (Phase 1)
1. **Strictly one-to-one.** A call has exactly two participants, both **registered users**. A third person is rejected with a clear "call is full" message. Do not build group, conference or many-to-many behavior.
2. **The receiver decides the listening language.** The other participant never sets it. The pipeline's target language is that participant's `listening_language`.
3. **No guest access in Phase 1.** Both people sign in. Guest links are deferred (see the last section) - do not build `/join/:token`, guest tokens or guest endpoints now.
4. **Every call, voice profile and usage record belongs to a workspace.** Usage is attributed to the call creator's workspace.
5. **Metering and limits must never degrade a live call.**
6. Build for billing later (clean usage events); do not integrate a payment provider until it is decided.

## Enforcing exactly two participants
- Enforce capacity **atomically** at join: Redis `SET NX`/Lua or a DB constraint, so two simultaneous joins cannot make three participants.
- Only the creator and one invited registered user may join. Verify membership on the WebSocket too; reject a third connection with a typed error (`CALL_FULL`).
- Ended calls cannot be re-joined. Expired invite links/room codes return one generic message (no existence leak).
- Invite tokens/room codes: cryptographically random, expiring, rate-limited on lookup (see `auth-security-privacy`).

## Workspaces & tenant isolation
- Tables: `workspaces` (id, name, plan_id, created_at), `workspace_members` (workspace_id, user_id, role: `owner|member` - Phase 1 may be owner-only, open decision), `plans` (limits as data); add `workspace_id` to `call_rooms`, `voice_profiles`, `usage_events`.
- Enforce tenant scope in **one place**: a dependency that resolves the current workspace plus a repository/query helper that always filters by it. Never trust a `workspace_id` from the request body.
- Cross-tenant access returns 404 (not 403). Test it for every resource.
- Tenant-scoped Redis keys include the workspace id (`ws:{wid}:concurrent_calls`).

## Usage metering
- `usage_events`: `id`, `workspace_id`, `call_id`, `participant_id`, `direction` (source->target), `stage` (`stt|translation|tts|media`), `provider`, `unit` (`seconds|chars|tokens`), `quantity`, `estimated_cost`, `occurred_at`, and a unique **`idempotency_key`** so retries don't double count.
- Emit events asynchronously (queue/outbox/background task); failing to record usage must not fail the call. Reconcile estimates against provider invoices periodically.
- Aggregate per workspace per day/month for the usage view and limit checks. Headline unit: **translated minutes** (exact billable unit is open).

## Plan limits & quotas
- Limits are data (`monthly_translated_minutes`, `max_concurrent_calls`, `enabled_languages`...). Enforce **server-side** at call creation and join, plus a periodic check during the call.
- Behavior (propose, confirm): warn the call owner at ~80%; at 100% block *new* calls with a clear message; for a call in progress finish the current utterance, then fall back to original audio (no translation) with a visible notice rather than cutting the call.
- The other participant sees a neutral message ("Translation is unavailable right now"), never billing details.
- Cost protection: rate limits and concurrency caps per workspace and per user, provider kill switch, anomaly alerts on minutes/hour.

## Later: commercialization (don't build until confirmed)
Subscriptions/free tier/pay-as-you-go, payment provider and invoices, teams/roles, admin dashboard, API keys and embeddable widget, data-residency options, branding. Keep usage events and `plan_id` clean so these plug in without a rewrite.

## Verify (Phase 1)
- A third participant cannot join (REST and WebSocket), including under simultaneous joins.
- Each participant hears the other in the language *that participant* chose.
- Cross-tenant requests return 404 in tests.
- Usage events appear once per segment (idempotent) and are attributed to the call creator's workspace.
- Hitting a plan limit shows the planned behavior; a metering failure doesn't drop the call.

---

## DEFERRED - Guest access via link (scope 5.4). Do NOT build in Phase 1.
Kept so the requirements are not lost. Build only after Phase 1 is validated and the user asks for it.

**Core requirement:** the guest receives audio in the language **the guest** chooses on the join screen. The caller's speaking/listening language and the link creator's settings never change what the guest hears.

Design notes for when it is built:
- Link token: `secrets.token_urlsafe(32)`+, **store only a hash**; bound to one call; `expires_at`, `revoked_at`; caller can revoke/regenerate and remove the guest.
- Public preview `GET /guest/{token}` returns the minimum (caller display name, call status, whether it has room); invalid/expired/revoked/unknown tokens return the same generic response.
- Join `POST /guest/{token}/join` with `{ displayName, speakingLanguage, listeningLanguage, disclosureAcknowledged: true }`: validate link, call state, **atomic capacity (max 2)**, language combination against the registry, acknowledgment. Returns a short-lived guest JWT scoped to that room (`role=guest`), rejected on every non-guest endpoint and used for the room WebSocket.
- If the chosen language is unsupported for the other participant's language, say so on the join screen and offer supported languages or original audio.
- `call_participants` would need nullable `user_id`, `is_guest`, `display_name`; guest PII purged after the call; guests use the standard voice unless a guest voice-consent flow exists.
- Rate-limit preview/join by IP and token; optional caller approval (waiting room) is an open decision.
- Open decisions that apply: scope section 15 items 21, 22, 25.
