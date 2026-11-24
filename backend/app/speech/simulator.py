import asyncio
import urllib.parse
from typing import AsyncIterator, Optional
import httpx
import logging

logger = logging.getLogger("voiceapp.speech")


class SimulatedSpeechToText:
    """Simulated streaming speech recognizer for Malayalam, Tamil, Hindi, and English."""

    async def transcribe_stream(self, audio_chunks: AsyncIterator[bytes], language: str) -> AsyncIterator[str]:
        async for _ in audio_chunks:
            await asyncio.sleep(0.1)
            if language == "ml-IN":
                yield "നമസ്കാരം, സുഖമാണോ?"
            elif language == "ta-IN":
                yield "வணக்கம், எப்படி இருக்கிறீர்கள்?"
            elif language == "hi-IN":
                yield "नमस्ते, आप कैसे हैं?"
            else:
                yield "Hello, how are you?"

    async def transcribe_chunk(self, audio_chunk: bytes, language: str) -> str:
        await asyncio.sleep(0.15)
        if language == "ml-IN":
            return "സുഖമായിരിക്കുന്നു, നന്ദി."
        elif language == "ta-IN":
            return "நன்றாக இருக்கிறேன், நன்றி."
        elif language == "hi-IN":
            return "मैं ठीक हूँ, धन्यवाद।"
        else:
            return "I am doing well, thank you."


import httpx
import logging

logger = logging.getLogger("voiceapp.speech")

class SimulatedTranslator:
    """Hybrid multilingual translator for Malayalam, Tamil, Hindi, and English.
    Uses an in-memory phrasebook for instant low-latency translation with an online fallback."""

    PREFIXES = {
        "ml-IN": "വിവർത്തനം",
        "ta-IN": "மொழிபெயர்ப்பு",
        "hi-IN": "अनुवाद",
        "en-IN": "Translation",
    }

    # Core bidirectional dictionary
    PHRASES = {
        "hello": {
            "en": "Hello",
            "ta": "வணக்கம்",
            "ml": "നമസ്കാരം",
            "hi": "नमस्ते",
        },
        "hi": {
            "en": "Hi",
            "ta": "வணக்கம்",
            "ml": "നമസ്കാരം",
            "hi": "नमस्ते",
        },
        "good morning": {
            "en": "Good morning",
            "ta": "காலை வணக்கம்",
            "ml": "സുപ്രഭാതം",
            "hi": "सुप्रभात",
        },
        "good afternoon": {
            "en": "Good afternoon",
            "ta": "மதிய வணக்கம்",
            "ml": "ശുഭദിനം",
            "hi": "शुभ दोपहर",
        },
        "good evening": {
            "en": "Good evening",
            "ta": "மாலை வணக்கம்",
            "ml": "ശുഭസായാഹ്നം",
            "hi": "शुभ संध्या",
        },
        "good night": {
            "en": "Good night",
            "ta": "இனிய இரவு",
            "ml": "ശുഭരാത്രി",
            "hi": "शुभ रात्रि",
        },
        "how are you": {
            "en": "How are you?",
            "ta": "நீங்கள் எப்படி இருக்கிறீர்கள்?",
            "ml": "നിങ്ങൾക്ക് സുഖമാണോ?",
            "hi": "आप कैसे हैं?",
        },
        "i am fine": {
            "en": "I am doing well, thank you",
            "ta": "நான் நன்றாக இருக்கிறேன், நன்றி",
            "ml": "എനിക്ക് സുഖമാണ്, നന്ദി",
            "hi": "मैं ठीक हूँ, धन्यवाद",
        },
        "i am good": {
            "en": "I am good",
            "ta": "நான் நன்றாக உள்ளேன்",
            "ml": "സുഖമായിരിക്കുന്നു",
            "hi": "मैं अच्छा हूँ",
        },
        "thank you": {
            "en": "Thank you very much",
            "ta": "மிக்க நன்றி",
            "ml": "വളരെ നന്ദി",
            "hi": "बहुत बहुत धन्यवाद",
        },
        "welcome": {
            "en": "You are welcome",
            "ta": "நல்வரவு",
            "ml": "സ്വാഗതം",
            "hi": "स्वागत है",
        },
        "yes": {
            "en": "Yes",
            "ta": "ஆம்",
            "ml": "അതെ",
            "hi": "हाँ",
        },
        "no": {
            "en": "No",
            "ta": "இல்லை",
            "ml": "അല്ല",
            "hi": "नहीं",
        },
        "okay": {
            "en": "Okay",
            "ta": "சரி",
            "ml": "ശരി",
            "hi": "ठीक है",
        },
        "alright": {
            "en": "Alright",
            "ta": "சரி",
            "ml": "ശരി",
            "hi": "ठीक है",
        },
        "can you hear me": {
            "en": "Can you hear me?",
            "ta": "நான் பேசுவது கேட்கிறதா?",
            "ml": "ഞാൻ സംസാരിക്കുന്നത് കേൾക്കാമോ?",
            "hi": "क्या आप मुझे सुन सकते हैं?",
        },
        "yes i can hear you": {
            "en": "Yes, I can hear you clearly",
            "ta": "ஆம், தெளிவாக கேட்கிறது",
            "ml": "അതെ, വ്യക്തമായി കേൾക്കാം",
            "hi": "हाँ, मैं आपको स्पष्ट सुन सकता हूँ",
        },
        "goodbye": {
            "en": "Goodbye, take care",
            "ta": "போய் வருகிறேன், பார்த்துக் கொள்ளுங்கள்",
            "ml": "വിട, ശ്രദ്ധിക്കുക",
            "hi": "अलविदा, ध्यान रखें",
        },
        "see you later": {
            "en": "See you later",
            "ta": "பிறகு சந்திப்போம்",
            "ml": "പിന്നെ കാണാം",
            "hi": "बाद में मिलते हैं",
        },
        "nice to meet you": {
            "en": "Nice to meet you",
            "ta": "உங்களை சந்தித்ததில் மகிழ்ச்சி",
            "ml": "കണ്ടതിൽ സന്തോഷം",
            "hi": "आपसे मिलकर अच्छा लगा",
        },
        "what is your name": {
            "en": "What is your name?",
            "ta": "உங்கள் பெயர் என்ன?",
            "ml": "നിങ്ങളുടെ പേരെന്താണ്?",
            "hi": "आपका नाम क्या है?",
        },
    }

    def __init__(self):
        self._cache = {}
        # Pre-seed cache with all pairwise phrase translations
        for phrase_map in self.PHRASES.values():
            for src_lang, src_val in phrase_map.items():
                for tgt_lang, tgt_val in phrase_map.items():
                    if src_lang != tgt_lang:
                        self._cache[(src_val.lower().strip("?.!"), src_lang, tgt_lang)] = tgt_val
                        self._cache[(src_val.strip("?.!"), src_lang, tgt_lang)] = tgt_val

    def _normalize_lang(self, code: str) -> str:
        code = code.lower()
        if code.startswith("ta"):
            return "ta"
        if code.startswith("ml"):
            return "ml"
        if code.startswith("hi"):
            return "hi"
        return "en"

    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        clean = text.strip()
        if not clean:
            return ""

        src_norm = self._normalize_lang(source_language)
        tgt_norm = self._normalize_lang(target_language)

        if src_norm == tgt_norm:
            return clean

        cache_key = (clean.lower().strip("?.!"), src_norm, tgt_norm)
        if cache_key in self._cache:
            return self._cache[cache_key]

        # 1. Primary Engine: High-precision Google Translation engine (covers all pairs, full sentences & idioms)
        try:
            encoded_q = urllib.parse.quote(clean)
            gtx_url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={src_norm}&tl={tgt_norm}&dt=t&q={encoded_q}"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            }
            async with httpx.AsyncClient(timeout=3.5) as client:
                res = await client.get(gtx_url, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    if isinstance(data, list) and len(data) > 0 and isinstance(data[0], list):
                        translated = "".join([seg[0] for seg in data[0] if seg and seg[0]]).strip()
                        if translated:
                            self._cache[cache_key] = translated
                            return translated
        except Exception as e:
            logger.warning(f"Google translate engine failed or timed out: {e}")

        # 2. Secondary Engine: Curated Phrasebook matching
        for (phrase_text, p_src, p_tgt), translation in self._cache.items():
            if p_src == src_norm and p_tgt == tgt_norm and phrase_text in clean.lower():
                if len(clean) <= len(phrase_text) + 6:
                    return translation

        # 3. Tertiary Engine: MyMemory translation fallback
        try:
            langpair = f"{src_norm}|{tgt_norm}"
            async with httpx.AsyncClient(timeout=2.5) as client:
                res = await client.get(
                    "https://api.mymemory.translated.net/get",
                    params={"q": clean, "langpair": langpair},
                )
                if res.status_code == 200:
                    data = res.json()
                    translated = data.get("responseData", {}).get("translatedText", "")
                    if (
                        translated
                        and "QUERY LENGTH LIMIT" not in translated
                        and not translated.startswith("INVALID")
                        and len(translated) > 1
                    ):
                        self._cache[cache_key] = translated
                        return translated
        except Exception as e:
            logger.debug(f"MyMemory translation failed: {e}")

        # 4. Final Fallback: Language prefix with original clean text
        prefix = self.PREFIXES.get(target_language, self.PREFIXES.get(f"{tgt_norm}-IN", "Translation"))
        return f"{prefix}: {clean}"


class SimulatedTextToSpeech:
    """Simulated speech synthesis returning simulated audio payload."""

    async def synthesize(
        self,
        text: str,
        language: str,
        voice_id: Optional[str] = None,
    ) -> bytes:
        await asyncio.sleep(0.18)
        # Return dummy audio buffer (e.g. WAV header or placeholder bytes)
        return b"RIFFsimulated_audio_bytes_wav_format"


class SimulatedVoiceProfileProvider:
    """Simulated speaker voice cloning provider."""

    async def create_voice_profile(self, user_id: str, audio_sample: bytes) -> str:
        await asyncio.sleep(0.3)
        return f"voice_clone_{user_id[:8]}"

    async def delete_voice_profile(self, provider_voice_id: str) -> bool:
        await asyncio.sleep(0.1)
        return True
