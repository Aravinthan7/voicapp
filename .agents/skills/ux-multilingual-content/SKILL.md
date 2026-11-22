---
name: ux-multilingual-content
description: Multilingual UI and content handling for VoiceApp - UI localization approach, Malayalam and Tamil script rendering, language selectors with native names, lang attributes, text expansion, captions in two scripts, and number/date formatting. Use when adding language selectors, translatable UI text, captions, or any screen that must display Malayalam or Tamil.
---

# Multilingual UX & Content

The product is about Malayalam and Tamil speakers, so their scripts and language names must be handled as first-class content from day one - even before the UI itself is translated.

## Decide the layers (don't conflate them)
1. **Speaking language** - what the user talks in (ml / ta).
2. **Listening language** - what they want to hear (ml / ta).
3. **UI language** - the interface text. Phase 1 may ship English-only; **design for later translation** (open question: confirm with the user whether Malayalam/Tamil UI is wanted in the MVP - many target users may prefer native-language UI, especially for consent text).
4. **Caption language** - original text and translated text (if captions ship; open decision).

## Language data model
Single source of truth in `src/types/language.ts` and the backend `GET /languages` response:
```ts
export type LanguageCode = 'ml-IN' | 'ta-IN'
export interface LanguageOption {
  code: LanguageCode
  englishName: string      // 'Malayalam'
  nativeName: string       // 'മലയാളം'
  speechSupported: boolean
  voiceCloningSupported: boolean
}
```
Never hard-code pairs in components; derive allowed combinations from the API so adding a language is data, not UI surgery. Use BCP-47 codes consistently with the backend.

## Language selectors
- Show **native name first with English in smaller text**: "മലയാളം - Malayalam", "தமிழ் - Tamil", so users recognize their own language.
- Use plain `<select>` or a radio group (2 options -> radio cards are friendlier). Label them with clear questions: "I speak" / "I want to hear".
- If the user picks the same speaking and listening language, or an unsupported pair, show an inline explanation and disable "Start call" - don't fail later.
- Show the pair in the call header with direction arrows or text: "Malayalam -> Tamil" from the user's own perspective.

## Rendering Malayalam & Tamil
- Font stack in `@theme`: `'Inter', 'Noto Sans Malayalam', 'Noto Sans Tamil', system-ui, sans-serif`. Self-host Noto fonts (`@fontsource/noto-sans-malayalam`, `@fontsource/noto-sans-tamil`, with `font-display: swap` and only needed weights) so rendering doesn't depend on the user's device.
- Add `lang="ml"` / `lang="ta"` to elements containing that text (affects font selection, hyphenation, screen readers).
- Line-height >= 1.6 and extra padding for these scripts; test that conjuncts and vowel signs aren't clipped in buttons, badges, and captions (`overflow-hidden` + tight line-height clips them).
- Do not use `uppercase`/`letter-spacing` utilities on Indic text; do not truncate mid-grapheme (use CSS `text-overflow` rather than JS substring - JS string slicing can split combining marks; use `Intl.Segmenter` if you must count characters).
- Test with real strings, not Lorem Ipsum, and include mixed-script text (Malayalam + English names/numbers).

## UI string handling
- Keep user-visible text in a central module (`src/i18n/en.ts` or `strings.ts`) rather than scattering literals, so extraction later is mechanical. Add a library (e.g. `react-i18next`) only when a second UI language is actually requested - avoid premature dependencies.
- Leave room: UI text in Tamil/Malayalam is typically 20-40% longer; layouts must flex (see `ui-layout-responsive`).
- Avoid concatenating sentence fragments; use whole-sentence templates with placeholders so word order can change.
- Format numbers/dates/durations with `Intl.NumberFormat` / `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` using the user's locale.

## Captions (if shipped)
- Two lines per utterance: original (speaker's script) and translation; each with the correct `lang`.
- Mark speaker name and finalized vs partial text (partials muted). Make font size user-adjustable and allow turning captions off.
- Only the AI translation can be wrong - add a subtle "machine translation" cue and a way to flag a bad translation (feeds quality evaluation).
- Never persist captions (no transcript history in Phase 1).

## Consent and legal text
Provide consent and privacy text in the user's speaking language (reviewed by a native speaker), not just English - consent in a language the user can't comfortably read isn't meaningful. See `voice-profile-consent`.

## Done when
Both scripts render correctly (no clipping, no tofu boxes) on Windows, Android and iOS browsers; language pair logic comes from data; every translatable string has a central home; lang attributes set.
