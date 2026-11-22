---
name: provider-evaluation
description: Structured evaluation of STT, translation, TTS and voice-cloning providers/models for Malayalam-Tamil, producing evidence for the open provider decision (milestone 1 and 4). Use when comparing or selecting a speech/translation/voice provider, running proof-of-concept benchmarks, or writing a provider decision record.
---

# Provider Evaluation

The scope says the exact providers and deployment platform are chosen **after a technical proof of concept**. This skill turns that into a repeatable process. Never pick a provider by marketing claims; "supports 100 languages" does not mean usable Malayalam or Tamil.

## Checklist per provider/model (from scope 7)
- [ ] Explicit Malayalam STT support (and quality)
- [ ] Explicit Tamil STT support
- [ ] ML->TA and TA->ML translation quality
- [ ] Target-language TTS quality (ML and TA)
- [ ] Cross-lingual voice cloning for both languages (separately verified)
- [ ] Streaming / chunked audio in and out
- [ ] End-to-end latency
- [ ] Commercial usage rights and license (especially for open-weights models)
- [ ] Data retention, training-on-your-data, privacy and deletion policy; region
- [ ] Pricing, rate limits, concurrency limits

## Method
1. **Build an evaluation set** (`backend/tests/eval/` or `docs/eval/`): short and long utterances; multiple speakers, genders, accents/dialects; quiet and noisy audio; phone-quality audio; code-mixed speech (Malayalam/Tamil + English); numbers, names, places; ~50-100 items per language to start. Get native-speaker reference transcripts and reference translations. Only use audio with permission.
2. **Run each stage in isolation** with an adapter under `speech/<stage>/` so providers are swappable and results reproducible (script + fixed inputs + saved raw outputs).
3. **Measure** (see `quality-metrics-testing`):
   - STT: WER/CER per language and per condition; streaming first-partial and final latency.
   - Translation: native-speaker adequacy/fluency rating (1-5) on a sample; optionally chrF/COMET as a secondary signal. Do not rely on BLEU alone.
   - TTS: native-speaker naturalness MOS-style rating and intelligibility; pronunciation of names/numbers.
   - Voice cloning: similarity rating by the *consenting* speaker and listeners; cross-lingual drift (accent, identity).
   - Latency per stage and end-to-end; cost per call minute at expected usage.
4. **Test the combination**, not just the parts: STT errors compound through translation and TTS.
5. **Check legal/privacy**: license permits commercial use; DPA/retention terms acceptable; no training on user audio, or an opt-out.

## Output: a decision record (`docs/decisions/NNN-provider-<stage>.md`)
Context, options compared (table with the checklist), measured results with data and dates, cost estimate, risks, decision, fallback provider, and revisit conditions. Update `Project_scope.md` section 15 and section 16 (Validation) when decisions are made.

## Rules
- Record exact model/version and date; providers change quickly.
- Keep the fallback path alive: at least one standard-voice TTS that is known to work for both languages.
- Keep API keys in env; evaluation scripts read them from `.env`, never commit them.
- State uncertainty plainly. If a language/feature is unverified, say "unverified", not "supported".
