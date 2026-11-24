import asyncio
from typing import AsyncIterator, Optional


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


class SimulatedTranslator:
    """Simulated multilingual translator for Malayalam, Tamil, Hindi, and English."""

    PREFIXES = {
        "ml-IN": "വിവർത്തനം",
        "ta-IN": "மொழிபெயர்ப்பு",
        "hi-IN": "अनुवाद",
        "en-IN": "Translation",
    }

    DICTIONARY_ML_TO_TA = {
        "നമസ്കാരം": "வணக்கம்",
        "സുഖമാണോ?": "எப்படி இருக்கிறீர்கள்?",
        "എന്റെ പേര് രാഹുൽ": "என் பெயர் ராகுல்",
        "ശരി": "சரி",
        "നന്ദി": "நன்றி",
        "വിട": "போய் வருகிறேன்",
    }

    DICTIONARY_TA_TO_ML = {
        "வணக்கம்": "നമസ്കാരം",
        "எப்படி இருக்கிறீர்கள்?": "സുഖമാണോ?",
        "என் பெயர் கார்த்திக்": "എന്റെ പേര് കാർത്തിക്",
        "சரி": "ശരി",
        "நன்றி": "നന്ദി",
        "போய் வருகிறேன்": "വിട",
    }

    DICTIONARY_TO_HI = {
        "നമസ്കാരം": "नमस्ते",
        "வணக்கம்": "नमस्ते",
        "Hello": "नमस्ते",
        "സുഖമാണോ?": "आप कैसे हैं?",
        "எப்படி இருக்கிறீர்கள்?": "आप कैसे हैं?",
        "How are you?": "आप कैसे हैं?",
        "നന്ദി": "धन्यवाद",
        "நன்றி": "धन्यवाद",
        "Thank you": "धन्यवाद",
        "ശരി": "ठीक है",
        "சரி": "ठीक है",
        "Alright": "ठीक है",
    }

    DICTIONARY_TO_EN = {
        "നമസ്കാരം": "Hello",
        "வணக்கம்": "Hello",
        "नमस्ते": "Hello",
        "സുഖമാണോ?": "How are you?",
        "எப்படி இருக்கிறீர்கள்?": "How are you?",
        "आप कैसे हैं?": "How are you?",
        "നന്ദി": "Thank you",
        "நன்றி": "Thank you",
        "धन्यवाद": "Thank you",
        "ശരി": "Alright",
        "சரி": "Alright",
        "ठीक है": "Alright",
    }

    async def translate(self, text: str, source_language: str, target_language: str) -> str:
        await asyncio.sleep(0.12)
        clean = text.strip()
        if source_language == target_language:
            return clean

        if target_language.startswith("en"):
            for k, v in self.DICTIONARY_TO_EN.items():
                if k in clean:
                    clean = clean.replace(k, v)
            return clean if clean != text.strip() else f"Translation: {text}"

        if target_language.startswith("hi"):
            for k, v in self.DICTIONARY_TO_HI.items():
                if k in clean:
                    clean = clean.replace(k, v)
            return clean if clean != text.strip() else f"अनुवाद: {text}"

        if source_language.startswith("ml") and target_language.startswith("ta"):
            for k, v in self.DICTIONARY_ML_TO_TA.items():
                if k in clean:
                    clean = clean.replace(k, v)
            return clean if clean != text.strip() else f"மொழிபெயர்ப்பு: {text}"

        if source_language.startswith("ta") and target_language.startswith("ml"):
            for k, v in self.DICTIONARY_TA_TO_ML.items():
                if k in clean:
                    clean = clean.replace(k, v)
            return clean if clean != text.strip() else f"വിവർത്തനം: {text}"

        prefix = self.PREFIXES.get(target_language, "Translation")
        return f"{prefix}: {text}"


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
