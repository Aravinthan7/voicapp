---
name: quality-metrics-testing
description: Testing strategy, metrics instrumentation and MVP acceptance verification for VoiceApp - unit/integration/e2e tests, latency and quality measurement, success metrics, and the Phase 1 acceptance checklist. Use when writing tests, adding measurement, preparing controlled user testing, or judging whether Phase 1 is done.
---

# Quality, Metrics & Testing

## Test layers
- **Frontend**: Vitest + React Testing Library (add only when first tests are written; keep dependencies minimal). Test forms, protected routes, call-control state, error banners. Mock `services/` and `getUserMedia`/`RTCPeerConnection`. Playwright (with `--use-fake-device-for-media-stream --use-fake-ui-for-media-stream`) for two-browser call smoke tests.
- **Backend**: pytest + pytest-asyncio + httpx. Unit-test services with fake providers; API tests with dependency overrides; WebSocket signaling tests (join, relay, third-participant rejection, disconnect cleanup); authorization tests for every endpoint, cross-tenant access tests (must 404), and a test that a third participant is rejected on REST and WebSocket (calls are strictly one-to-one).
- **Pipeline**: replay recorded audio through the pipeline with fake/real providers; assert ordering, no duplicate playback, correct fallback on injected failures/timeouts. Parametrize over the enabled language directions and include a synthetic third language in tests to catch hard-coded Malayalam/Tamil assumptions.
- **Contract tests** per provider adapter so swapping providers doesn't silently change behavior.
- Never call paid providers in default CI; mark such tests `@pytest.mark.live` and run them manually.

## Metrics to instrument (scope section 14)
| Metric | How |
|---|---|
| End-of-phrase -> translated playback start | per-segment timestamps (see `translation-pipeline`), report p50/p95 |
| Per-stage latency (STT, MT, TTS first byte) | same timestamps |
| STT accuracy per supported language (first: ML, TA) | WER/CER on the eval set (see `provider-evaluation`) |
| Translation quality | native-speaker ratings on samples |
| % speech successfully processed | processed segments / detected segments |
| Call connection success rate | `connected` / attempts from signaling events |
| Audio interruption/failure rate | WebRTC `getStats` (loss, jitter), reconnect counts, pipeline error codes |
| Voice similarity/naturalness | listener ratings, only where cloning is enabled |
| Cost per call minute | `usage_events` aggregated |
| Comprehension without assistance | post-call user survey |
| Call join success and time-to-join | funnel events: invite opened -> languages confirmed -> mic OK -> joined |
| Minutes and cost per workspace vs plan limits | `usage_events` aggregated |
| Limit-reached and abuse events | rate-limit/quota logs (IDs and counts only) |

Privacy: metrics carry IDs, durations and codes - never transcripts or audio.

## Phase 1 acceptance checklist (scope section 12)
- [ ] Two users join the same audio room
- [ ] Each user can pick any supported speaking and listening language
- [ ] For every enabled combination, the receiver hears audio in their chosen listening language
- [ ] First validated pair: ML->TA and TA->ML both work
- [ ] Same language on both sides -> original audio, no translation
- [ ] Unsupported combination is blocked before the call with a clear message
- [ ] Each participant hears the other in the language *that participant* chose
- [ ] A call has exactly two registered participants; a third is rejected with a clear message
- [ ] Both participants see and acknowledge the AI-processing disclosure before joining
- [ ] Usage is recorded against the call creator's workspace and plan limits show a clear message
- [ ] Translation starts automatically; no manual action
- [ ] Both directions work in the same call
- [ ] Mute, unmute, end call work
- [ ] Mic-permission denial and common connection failures handled with clear UI
- [ ] Original and translated audio are not unintentionally mixed
- [ ] Consent and deletion work if cloning is enabled
- [ ] Latency, recognition, translation quality, naturalness measured and documented
- [ ] Standard generated-voice fallback exists and is exercised in tests

## Controlled-testing practice
Test with real native speakers, in varied environments, on headphones and speakers, desktop and mobile browsers, poor networks (throttle in DevTools / `tc`), and overlapping speech. Log findings in `docs/testing/`. Report results honestly, including failures and unverified items.

## Definition of done for any task
Code builds and lints (`npm run build && npm run lint`; backend tests + type check), new behavior has a test or a documented manual check, no secrets/audio in logs, and `Project_scope.md` section 16 is updated.
